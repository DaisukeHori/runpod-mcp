/**
 * RunPod API クライアント
 *
 * REST API + GraphQL API の両方を使用する。
 * - Bearer Token 認証
 * - レート制限対応（自動リトライ）
 * - エクスポネンシャルバックオフ
 */

import { getConfig } from "@/lib/config";
import { RunPodError } from "./errors";
import type {
  RunPodPod,
  CreatePodInput,
  RunPodEndpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
  RunPodJobResponse,
  RunPodRunInput,
  RunPodGpuType,
} from "./types";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// ── 内部ヘルパー ──

function getHeaders(): Record<string, string> {
  const { runpodApiKey } = getConfig();
  return {
    Authorization: `Bearer ${runpodApiKey}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch {
      // JSON パースに失敗した場合はデフォルトメッセージを使用
    }
    throw new RunPodError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get("Retry-After");
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof RunPodError && error.status !== 429 && error.status < 500) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw lastError;
      }

      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Unexpected retry loop exit");
}

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { graphqlUrl } = getConfig();
  const body = JSON.stringify({ query, variables });
  const result = await fetchWithRetry<{ data: T; errors?: { message: string }[] }>(
    graphqlUrl,
    { method: "POST", headers: getHeaders(), body }
  );

  if (result.errors && result.errors.length > 0) {
    throw new RunPodError(400, result.errors.map((e) => e.message).join("; "));
  }

  return result.data;
}

// ── Pod 管理 (REST API) ──

export async function listPods(): Promise<RunPodPod[]> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodPod[]>(`${restBaseUrl}/pods`, {
    method: "GET",
    headers: getHeaders(),
  });
}

export async function getPod(podId: string): Promise<RunPodPod> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodPod>(`${restBaseUrl}/pods/${podId}`, {
    method: "GET",
    headers: getHeaders(),
  });
}

export async function createPod(input: CreatePodInput): Promise<RunPodPod> {
  const { restBaseUrl } = getConfig();
  const body: Record<string, unknown> = {
    name: input.name,
    imageName: input.imageName,
    gpuTypeId: input.gpuTypeId,
    gpuCount: input.gpuCount ?? 1,
    containerDiskInGb: input.containerDiskInGb ?? 20,
    volumeInGb: input.volumeInGb ?? 0,
  };
  if (input.ports) body.ports = input.ports;
  if (input.env) body.env = input.env;
  if (input.startSsh !== undefined) body.startSsh = input.startSsh;

  return fetchWithRetry<RunPodPod>(`${restBaseUrl}/pods`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
}

export async function stopPod(podId: string): Promise<void> {
  const { restBaseUrl } = getConfig();
  await fetchWithRetry<unknown>(`${restBaseUrl}/pods/${podId}/stop`, {
    method: "POST",
    headers: getHeaders(),
  });
}

export async function terminatePod(podId: string): Promise<void> {
  const { restBaseUrl } = getConfig();
  await fetchWithRetry<void>(`${restBaseUrl}/pods/${podId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}

// ── サーバーレス Endpoint 管理 (REST API) ──

export async function listEndpoints(): Promise<RunPodEndpoint[]> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodEndpoint[]>(`${restBaseUrl}/endpoints`, {
    method: "GET",
    headers: getHeaders(),
  });
}

export async function getEndpoint(endpointId: string): Promise<RunPodEndpoint> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodEndpoint>(`${restBaseUrl}/endpoints/${endpointId}`, {
    method: "GET",
    headers: getHeaders(),
  });
}

export async function createEndpoint(input: CreateEndpointInput): Promise<RunPodEndpoint> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodEndpoint>(`${restBaseUrl}/endpoints`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: input.name,
      templateId: input.templateId,
      gpuIds: input.gpuIds,
      workersMin: input.workersMin ?? 0,
      workersMax: input.workersMax ?? 3,
      idleTimeout: input.idleTimeout ?? 5,
    }),
  });
}

export async function updateEndpoint(
  endpointId: string,
  updates: UpdateEndpointInput
): Promise<RunPodEndpoint> {
  const { restBaseUrl } = getConfig();
  return fetchWithRetry<RunPodEndpoint>(`${restBaseUrl}/endpoints/${endpointId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
}

// ── サーバーレス Job 実行 ──

export async function runJob(
  endpointId: string,
  input: RunPodRunInput
): Promise<RunPodJobResponse> {
  const { serverlessBaseUrl } = getConfig();
  return fetchWithRetry<RunPodJobResponse>(
    `${serverlessBaseUrl}/${endpointId}/run`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(input),
    }
  );
}

export async function runJobSync(
  endpointId: string,
  input: RunPodRunInput
): Promise<RunPodJobResponse> {
  const { serverlessBaseUrl } = getConfig();
  return fetchWithRetry<RunPodJobResponse>(
    `${serverlessBaseUrl}/${endpointId}/runsync`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(input),
    }
  );
}

export async function getJobStatus(
  endpointId: string,
  jobId: string
): Promise<RunPodJobResponse> {
  const { serverlessBaseUrl } = getConfig();
  return fetchWithRetry<RunPodJobResponse>(
    `${serverlessBaseUrl}/${endpointId}/status/${jobId}`,
    { method: "GET", headers: getHeaders() }
  );
}

export async function cancelJob(
  endpointId: string,
  jobId: string
): Promise<void> {
  const { serverlessBaseUrl } = getConfig();
  await fetchWithRetry<unknown>(
    `${serverlessBaseUrl}/${endpointId}/cancel/${jobId}`,
    { method: "POST", headers: getHeaders() }
  );
}

// ── GPU 情報 (GraphQL API) ──

export async function getGpuTypes(): Promise<RunPodGpuType[]> {
  const data = await graphqlQuery<{ gpuTypes: RunPodGpuType[] }>(`
    query {
      gpuTypes {
        id
        displayName
        memoryInGb
        secureCloud
        communityCloud
        lowestPrice {
          minimumBidPrice
          uninterruptablePrice
        }
      }
    }
  `);
  return data.gpuTypes;
}

// ── アカウント情報 (GraphQL API) ──

export interface RunPodAccountInfo {
  id: string;
  email: string;
  currentSpendPerHr: number;
  machineQuota: number;
  referralEarned: number;
  signedTermsOfService: boolean;
  spendLimit: number;
  templateEarned: number;
  multiFactorEnabled: boolean;
  clientBalance: number;
  hostBalance: number;
  underBalance: boolean;
}

export async function getAccountInfo(): Promise<RunPodAccountInfo> {
  const data = await graphqlQuery<{ myself: RunPodAccountInfo }>(`
    query {
      myself {
        id
        email
        currentSpendPerHr
        machineQuota
        referralEarned
        signedTermsOfService
        spendLimit
        templateEarned
        multiFactorEnabled
        clientBalance
        hostBalance
        underBalance
      }
    }
  `);
  return data.myself;
}
