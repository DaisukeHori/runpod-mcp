/**
 * RunPod Client 単体テスト (42件)
 *
 * fetch をモックして各関数の呼び出しパターンを検証する
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// config モック
vi.mock("@/lib/config", () => ({
  getConfig: () => ({
    runpodApiKey: "test-api-key",
    restBaseUrl: "https://rest.runpod.io/v1",
    graphqlUrl: "https://api.runpod.io/graphql",
    serverlessBaseUrl: "https://api.runpod.ai/v2",
  }),
}));

import {
  listPods,
  getPod,
  createPod,
  stopPod,
  terminatePod,
  listEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  runJob,
  runJobSync,
  getJobStatus,
  cancelJob,
  getGpuTypes,
  getAccountInfo,
} from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown, status = 200) {
  return mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });
}

function mockError(status: number, message: string) {
  return mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: message }),
    headers: new Headers(),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Pod 操作 ──

describe("listPods", () => {
  // 1
  it("should call GET /pods", async () => {
    mockOk([]);
    await listPods();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/pods",
      expect.objectContaining({ method: "GET" })
    );
  });

  // 2
  it("should return pod array", async () => {
    const pods = [{ id: "pod1", name: "test" }];
    mockOk(pods);
    const result = await listPods();
    expect(result).toEqual(pods);
  });

  // 3
  it("should include auth header", async () => {
    mockOk([]);
    await listPods();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer test-api-key");
  });

  // 4
  it("should throw RunPodError on 401", async () => {
    mockError(401, "Unauthorized");
    await expect(listPods()).rejects.toThrow(RunPodError);
  });
});

describe("getPod", () => {
  // 5
  it("should call GET /pods/:id", async () => {
    mockOk({ id: "abc123" });
    await getPod("abc123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/pods/abc123",
      expect.objectContaining({ method: "GET" })
    );
  });

  // 6
  it("should return pod data", async () => {
    const pod = { id: "abc", name: "my-pod", gpuCount: 1 };
    mockOk(pod);
    const result = await getPod("abc");
    expect(result).toEqual(pod);
  });

  // 7
  it("should throw on 404", async () => {
    mockError(404, "Not found");
    await expect(getPod("nonexistent")).rejects.toThrow(RunPodError);
  });
});

describe("createPod", () => {
  // 8
  it("should call POST /pods", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "pytorch:latest",
      gpuTypeId: "NVIDIA RTX A6000",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/pods",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 9
  it("should send correct body with defaults", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "pytorch:latest",
      gpuTypeId: "A6000",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.gpuCount).toBe(1);
    expect(body.containerDiskInGb).toBe(20);
    expect(body.volumeInGb).toBe(0);
  });

  // 10
  it("should include optional ports", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "img",
      gpuTypeId: "A6000",
      ports: "8888/http",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.ports).toBe("8888/http");
  });

  // 11
  it("should include optional env", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "img",
      gpuTypeId: "A6000",
      env: { KEY: "VALUE" },
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.env).toEqual({ KEY: "VALUE" });
  });

  // 12
  it("should include startSsh when set", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "img",
      gpuTypeId: "A6000",
      startSsh: true,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.startSsh).toBe(true);
  });

  // 13
  it("should use custom gpuCount", async () => {
    mockOk({ id: "new-pod" });
    await createPod({
      name: "test",
      imageName: "img",
      gpuTypeId: "A6000",
      gpuCount: 4,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.gpuCount).toBe(4);
  });
});

describe("stopPod", () => {
  // 14
  it("should call POST /pods/:id/stop", async () => {
    mockOk({});
    await stopPod("pod-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/pods/pod-123/stop",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 15
  it("should not throw on success", async () => {
    mockOk({});
    await expect(stopPod("pod-123")).resolves.toBeUndefined();
  });
});

describe("terminatePod", () => {
  // 16
  it("should call DELETE /pods/:id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
      headers: new Headers(),
    });
    await terminatePod("pod-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/pods/pod-123",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  // 17
  it("should handle 204 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
      headers: new Headers(),
    });
    await expect(terminatePod("pod-x")).resolves.toBeUndefined();
  });
});

// ── Endpoint 操作 ──

describe("listEndpoints", () => {
  // 18
  it("should call GET /endpoints", async () => {
    mockOk([]);
    await listEndpoints();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/endpoints",
      expect.objectContaining({ method: "GET" })
    );
  });

  // 19
  it("should return endpoint array", async () => {
    const eps = [{ id: "ep1", name: "test-ep" }];
    mockOk(eps);
    const result = await listEndpoints();
    expect(result).toEqual(eps);
  });
});

describe("getEndpoint", () => {
  // 20
  it("should call GET /endpoints/:id", async () => {
    mockOk({ id: "ep1" });
    await getEndpoint("ep1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/endpoints/ep1",
      expect.objectContaining({ method: "GET" })
    );
  });

  // 21
  it("should return endpoint data", async () => {
    const ep = { id: "ep1", name: "my-endpoint" };
    mockOk(ep);
    const result = await getEndpoint("ep1");
    expect(result).toEqual(ep);
  });
});

describe("createEndpoint", () => {
  // 22
  it("should call POST /endpoints", async () => {
    mockOk({ id: "ep-new" });
    await createEndpoint({
      name: "test-ep",
      templateId: "tmpl-1",
      gpuIds: "A6000",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/endpoints",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 23
  it("should use defaults for optional fields", async () => {
    mockOk({ id: "ep-new" });
    await createEndpoint({
      name: "test",
      templateId: "tmpl-1",
      gpuIds: "A6000",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workersMin).toBe(0);
    expect(body.workersMax).toBe(3);
    expect(body.idleTimeout).toBe(5);
  });

  // 24
  it("should use custom worker counts", async () => {
    mockOk({ id: "ep-new" });
    await createEndpoint({
      name: "test",
      templateId: "tmpl-1",
      gpuIds: "A6000",
      workersMin: 2,
      workersMax: 10,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workersMin).toBe(2);
    expect(body.workersMax).toBe(10);
  });
});

describe("updateEndpoint", () => {
  // 25
  it("should call PATCH /endpoints/:id", async () => {
    mockOk({ id: "ep1" });
    await updateEndpoint("ep1", { name: "updated" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rest.runpod.io/v1/endpoints/ep1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  // 26
  it("should send update payload", async () => {
    mockOk({ id: "ep1" });
    await updateEndpoint("ep1", { workersMax: 5 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.workersMax).toBe(5);
  });
});

// ── Job 操作 ──

describe("runJob", () => {
  // 27
  it("should call POST /:endpointId/run", async () => {
    mockOk({ id: "job-1", status: "IN_QUEUE" });
    await runJob("ep1", { input: { prompt: "test" } });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.ai/v2/ep1/run",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 28
  it("should return job response", async () => {
    const job = { id: "job-1", status: "IN_QUEUE" };
    mockOk(job);
    const result = await runJob("ep1", { input: { prompt: "test" } });
    expect(result).toEqual(job);
  });

  // 29
  it("should send input in body", async () => {
    mockOk({ id: "job-1", status: "IN_QUEUE" });
    await runJob("ep1", { input: { prompt: "hello" } });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.input).toEqual({ prompt: "hello" });
  });
});

describe("runJobSync", () => {
  // 30
  it("should call POST /:endpointId/runsync", async () => {
    mockOk({ id: "job-2", status: "COMPLETED", output: {} });
    await runJobSync("ep1", { input: { data: [1, 2] } });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.ai/v2/ep1/runsync",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 31
  it("should return completed result", async () => {
    const job = { id: "job-2", status: "COMPLETED", output: { result: 42 } };
    mockOk(job);
    const result = await runJobSync("ep1", { input: {} });
    expect(result.output).toEqual({ result: 42 });
  });
});

describe("getJobStatus", () => {
  // 32
  it("should call GET /:endpointId/status/:jobId", async () => {
    mockOk({ id: "job-1", status: "IN_PROGRESS" });
    await getJobStatus("ep1", "job-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.ai/v2/ep1/status/job-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  // 33
  it("should return status data", async () => {
    const status = { id: "job-1", status: "COMPLETED", executionTime: 1500 };
    mockOk(status);
    const result = await getJobStatus("ep1", "job-1");
    expect(result.executionTime).toBe(1500);
  });
});

describe("cancelJob", () => {
  // 34
  it("should call POST /:endpointId/cancel/:jobId", async () => {
    mockOk({});
    await cancelJob("ep1", "job-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.ai/v2/ep1/cancel/job-1",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ── GraphQL 操作 ──

describe("getGpuTypes", () => {
  // 35
  it("should call graphql endpoint", async () => {
    mockOk({ data: { gpuTypes: [] } });
    await getGpuTypes();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.io/graphql",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 36
  it("should return gpu types array", async () => {
    const gpus = [{ id: "A6000", displayName: "NVIDIA RTX A6000", memoryInGb: 48 }];
    mockOk({ data: { gpuTypes: gpus } });
    const result = await getGpuTypes();
    expect(result).toEqual(gpus);
  });

  // 37
  it("should send graphql query in body", async () => {
    mockOk({ data: { gpuTypes: [] } });
    await getGpuTypes();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.query).toContain("gpuTypes");
  });

  // 38
  it("should throw on graphql errors", async () => {
    mockOk({ data: null, errors: [{ message: "Query failed" }] });
    await expect(getGpuTypes()).rejects.toThrow("Query failed");
  });
});

describe("getAccountInfo", () => {
  // 39
  it("should call graphql endpoint", async () => {
    mockOk({ data: { myself: { id: "user1", email: "test@test.com" } } });
    await getAccountInfo();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.runpod.io/graphql",
      expect.objectContaining({ method: "POST" })
    );
  });

  // 40
  it("should return account info", async () => {
    const account = { id: "user1", email: "a@b.com", clientBalance: 50.0 };
    mockOk({ data: { myself: account } });
    const result = await getAccountInfo();
    expect(result.email).toBe("a@b.com");
  });

  // 41
  it("should send 'myself' query", async () => {
    mockOk({ data: { myself: { id: "u1" } } });
    await getAccountInfo();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.query).toContain("myself");
  });

  // 42
  it("should throw on graphql errors", async () => {
    mockOk({ data: null, errors: [{ message: "Auth required" }] });
    await expect(getAccountInfo()).rejects.toThrow("Auth required");
  });
});
