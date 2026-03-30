/**
 * RunPod API 型定義
 */

// ── Pod 型 ──

export interface RunPodPod {
  id: string;
  name: string;
  imageName: string;
  desiredStatus: string;
  gpuCount: number;
  gpuTypeId: string;
  gpuDisplayName?: string;
  containerDiskInGb: number;
  volumeInGb: number;
  costPerHr: number;
  uptimeSeconds?: number;
  ports?: string;
  env?: Record<string, string>[];
  runtime?: {
    uptimeInSeconds?: number;
    gpus?: { id: string; gpuUtilPercent?: number; memoryUtilPercent?: number }[];
  };
}

export interface CreatePodInput {
  name: string;
  imageName: string;
  gpuTypeId: string;
  gpuCount?: number;
  containerDiskInGb?: number;
  volumeInGb?: number;
  ports?: string;
  env?: Record<string, string>;
  startSsh?: boolean;
}

// ── サーバーレス Endpoint 型 ──

export interface RunPodEndpoint {
  id: string;
  name: string;
  templateId?: string;
  gpuIds: string;
  workersMin: number;
  workersMax: number;
  idleTimeout: number;
  locations?: string;
  networkVolumeId?: string;
}

export interface CreateEndpointInput {
  name: string;
  templateId: string;
  gpuIds: string;
  workersMin?: number;
  workersMax?: number;
  idleTimeout?: number;
}

export interface UpdateEndpointInput {
  name?: string;
  gpuIds?: string;
  workersMin?: number;
  workersMax?: number;
  idleTimeout?: number;
}

// ── サーバーレス Job 型 ──

export interface RunPodJobResponse {
  id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
  output?: unknown;
  error?: string;
  executionTime?: number;
  delayTime?: number;
}

export interface RunPodRunInput {
  input: Record<string, unknown>;
  webhook?: string;
  policy?: {
    executionTimeout?: number;
  };
}

// ── GPU 型 ──

export interface RunPodGpuType {
  id: string;
  displayName: string;
  memoryInGb: number;
  secureCloud: boolean;
  communityCloud: boolean;
  lowestPrice: {
    minimumBidPrice?: number;
    uninterruptablePrice?: number;
  };
}
