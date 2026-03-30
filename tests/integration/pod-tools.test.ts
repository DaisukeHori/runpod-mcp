/**
 * Pod MCP ツール 結合テスト (50件)
 *
 * MCPツールの登録・実行を端から端まで検証する
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// config モック
vi.mock("@/lib/config", () => ({
  getConfig: () => ({
    runpodApiKey: "test-api-key",
    restBaseUrl: "https://rest.runpod.io/v1",
    graphqlUrl: "https://api.runpod.io/graphql",
    serverlessBaseUrl: "https://api.runpod.ai/v2",
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });
}

function mockError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: message }),
    headers: new Headers(),
  });
}

// McpServer モック
function createMockServer() {
  const tools: Record<string, { config: unknown; handler: (...args: unknown[]) => Promise<unknown> }> = {};
  return {
    registerTool: (name: string, config: unknown, handler: (...args: unknown[]) => Promise<unknown>) => {
      tools[name] = { config, handler };
    },
    tools,
    callTool: async (name: string, args: Record<string, unknown> = {}) => {
      return tools[name].handler(args);
    },
  };
}

import { registerPodList } from "@/lib/mcp/tools/pod-list";
import { registerPodGet } from "@/lib/mcp/tools/pod-get";
import { registerPodCreate } from "@/lib/mcp/tools/pod-create";
import { registerPodStop } from "@/lib/mcp/tools/pod-stop";
import { registerPodTerminate } from "@/lib/mcp/tools/pod-terminate";

beforeEach(() => {
  mockFetch.mockReset();
});

// ── pod_list ツール ──

describe("pod_list tool", () => {
  // 1
  it("should register with correct name", () => {
    const server = createMockServer();
    registerPodList(server as any);
    expect(server.tools).toHaveProperty("pod_list");
  });

  // 2
  it("should return pod list when pods exist", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Pod-1", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "pytorch", costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("Pod-1");
  });

  // 3
  it("should show pod count in header", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "A", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "img", costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0 },
      { id: "p2", name: "B", desiredStatus: "EXITED", gpuTypeId: "A6000", gpuCount: 1, imageName: "img", costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("2件");
  });

  // 4
  it("should show running status indicator", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Running Pod", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "img", costPerHr: 1.0, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("稼働中");
  });

  // 5
  it("should show stopped status indicator", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Stopped Pod", desiredStatus: "EXITED", gpuTypeId: "A6000", gpuCount: 1, imageName: "img", costPerHr: 0.0, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("停止");
  });

  // 6
  it("should show empty message when no pods", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("見つかりませんでした");
  });

  // 7
  it("should handle API error gracefully", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockError(401, "Unauthorized");
    const result = await server.callTool("pod_list") as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("エラー");
  });

  // 8
  it("should show GPU display name when available", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Test", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuDisplayName: "NVIDIA RTX A6000", gpuCount: 2, imageName: "img", costPerHr: 1.0, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("NVIDIA RTX A6000");
  });

  // 9
  it("should show cost per hour", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Test", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "img", costPerHr: 0.74, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("$0.74/hr");
  });

  // 10
  it("should show image name", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Test", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "runpod/pytorch:2.1.0", costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("runpod/pytorch:2.1.0");
  });

  // 11
  it("should handle 500 server error", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockError(500, "Internal Server Error");
    const result = await server.callTool("pod_list") as any;
    expect(result.isError).toBe(true);
  });

  // 12
  it("should handle network error", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await server.callTool("pod_list") as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("エラー");
  });
});

// ── pod_get ツール ──

describe("pod_get tool", () => {
  // 13
  it("should register with correct name", () => {
    const server = createMockServer();
    registerPodGet(server as any);
    expect(server.tools).toHaveProperty("pod_get");
  });

  // 14
  it("should return pod details", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "pod-1", name: "My Pod", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "pytorch",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 50,
      ports: "8888/http", uptimeSeconds: 3600,
    });
    const result = await server.callTool("pod_get", { podId: "pod-1" }) as any;
    expect(result.content[0].text).toContain("My Pod");
    expect(result.content[0].text).toContain("pod-1");
  });

  // 15
  it("should show GPU runtime info", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "pod-1", name: "Test", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "img",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0,
      runtime: { gpus: [{ id: "0", gpuUtilPercent: 95, memoryUtilPercent: 80 }] },
    });
    const result = await server.callTool("pod_get", { podId: "pod-1" }) as any;
    expect(result.content[0].text).toContain("95");
    expect(result.content[0].text).toContain("80");
  });

  // 16
  it("should show uptime in minutes", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0,
      uptimeSeconds: 7200,
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("120分");
  });

  // 17
  it("should handle missing runtime info", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "EXITED",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0, containerDiskInGb: 20, volumeInGb: 0,
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("ランタイム情報なし");
  });

  // 18
  it("should handle 404 error", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockError(404, "Pod not found");
    const result = await server.callTool("pod_get", { podId: "bad-id" }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("見つかりません");
  });

  // 19
  it("should show ports", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0,
      ports: "8888/http,22/tcp",
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("8888/http,22/tcp");
  });

  // 20
  it("should show 'なし' when no ports", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0,
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("なし");
  });
});

// ── pod_create ツール ──

describe("pod_create tool", () => {
  // 21
  it("should register with correct name", () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    expect(server.tools).toHaveProperty("pod_create");
  });

  // 22
  it("should create pod and return success message", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockOk({
      id: "new-pod", name: "Test Pod",
      gpuTypeId: "A6000", gpuDisplayName: "NVIDIA RTX A6000",
      gpuCount: 1, imageName: "pytorch:latest",
      costPerHr: 0.74, containerDiskInGb: 20, volumeInGb: 0,
    });
    const result = await server.callTool("pod_create", {
      name: "Test Pod", imageName: "pytorch:latest",
      gpuTypeId: "NVIDIA RTX A6000", gpuCount: 1,
      containerDiskInGb: 20, volumeInGb: 0,
    }) as any;
    expect(result.content[0].text).toContain("作成しました");
    expect(result.content[0].text).toContain("Test Pod");
  });

  // 23
  it("should handle creation error", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockError(400, "Invalid GPU type");
    const result = await server.callTool("pod_create", {
      name: "Test", imageName: "img",
      gpuTypeId: "INVALID", gpuCount: 1,
      containerDiskInGb: 20, volumeInGb: 0,
    }) as any;
    expect(result.isError).toBe(true);
  });

  // 24
  it("should show cost in success message", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockOk({
      id: "p1", name: "T", gpuTypeId: "A6000",
      gpuCount: 1, imageName: "img",
      costPerHr: 1.23, containerDiskInGb: 20, volumeInGb: 0,
    });
    const result = await server.callTool("pod_create", {
      name: "T", imageName: "img",
      gpuTypeId: "A6000", gpuCount: 1,
      containerDiskInGb: 20, volumeInGb: 0,
    }) as any;
    expect(result.content[0].text).toContain("$1.23/hr");
  });

  // 25
  it("should show GPU display name in response", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockOk({
      id: "p1", name: "T", gpuTypeId: "A6000",
      gpuDisplayName: "NVIDIA RTX A6000",
      gpuCount: 4, imageName: "img",
      costPerHr: 3.0, containerDiskInGb: 50, volumeInGb: 100,
    });
    const result = await server.callTool("pod_create", {
      name: "T", imageName: "img",
      gpuTypeId: "A6000", gpuCount: 4,
      containerDiskInGb: 50, volumeInGb: 100,
    }) as any;
    expect(result.content[0].text).toContain("NVIDIA RTX A6000");
    expect(result.content[0].text).toContain("x4");
  });

  // 26
  it("should handle 429 rate limit", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    // Mock multiple 429s then a final error (retries exhausted)
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    const result = await server.callTool("pod_create", {
      name: "T", imageName: "img",
      gpuTypeId: "A6000", gpuCount: 1,
      containerDiskInGb: 20, volumeInGb: 0,
    }) as any;
    expect(result.isError).toBe(true);
  });
});

// ── pod_stop ツール ──

describe("pod_stop tool", () => {
  // 27
  it("should register with correct name", () => {
    const server = createMockServer();
    registerPodStop(server as any);
    expect(server.tools).toHaveProperty("pod_stop");
  });

  // 28
  it("should return success message", async () => {
    const server = createMockServer();
    registerPodStop(server as any);
    mockOk({});
    const result = await server.callTool("pod_stop", { podId: "pod-123" }) as any;
    expect(result.content[0].text).toContain("停止しました");
    expect(result.content[0].text).toContain("pod-123");
  });

  // 29
  it("should mention volume data preserved", async () => {
    const server = createMockServer();
    registerPodStop(server as any);
    mockOk({});
    const result = await server.callTool("pod_stop", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("ボリュームデータ");
  });

  // 30
  it("should handle error when pod not found", async () => {
    const server = createMockServer();
    registerPodStop(server as any);
    mockError(404, "Pod not found");
    const result = await server.callTool("pod_stop", { podId: "bad" }) as any;
    expect(result.isError).toBe(true);
  });

  // 31
  it("should handle server error", async () => {
    const server = createMockServer();
    registerPodStop(server as any);
    mockError(500, "Internal error");
    const result = await server.callTool("pod_stop", { podId: "p1" }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("エラー");
  });
});

// ── pod_terminate ツール ──

describe("pod_terminate tool", () => {
  // 32
  it("should register with correct name", () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    expect(server.tools).toHaveProperty("pod_terminate");
  });

  // 33
  it("should return deletion confirmation", async () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 204,
      json: () => Promise.resolve(undefined),
      headers: new Headers(),
    });
    const result = await server.callTool("pod_terminate", { podId: "pod-1" }) as any;
    expect(result.content[0].text).toContain("削除しました");
  });

  // 34
  it("should include pod ID in message", async () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 204,
      json: () => Promise.resolve(undefined),
      headers: new Headers(),
    });
    const result = await server.callTool("pod_terminate", { podId: "xyz-789" }) as any;
    expect(result.content[0].text).toContain("xyz-789");
  });

  // 35
  it("should handle 404 error", async () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    mockError(404, "Not found");
    const result = await server.callTool("pod_terminate", { podId: "gone" }) as any;
    expect(result.isError).toBe(true);
  });

  // 36
  it("should handle auth error", async () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    mockError(401, "Unauthorized");
    const result = await server.callTool("pod_terminate", { podId: "p1" }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API キー");
  });

  // 37
  it("should handle unexpected error", async () => {
    const server = createMockServer();
    registerPodTerminate(server as any);
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
    const result = await server.callTool("pod_terminate", { podId: "p1" }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("エラー");
  });
});

// ── Pod ツール共通パターン ──

describe("pod tools common patterns", () => {
  // 38
  it("all pod tools should use text content type", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].type).toBe("text");
  });

  // 39
  it("pod_get should handle unexpected error types", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockFetch.mockRejectedValueOnce("string error");
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.isError).toBe(true);
  });

  // 40
  it("pod_create should handle permission error", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockError(403, "Forbidden");
    const result = await server.callTool("pod_create", {
      name: "T", imageName: "i", gpuTypeId: "A6000",
      gpuCount: 1, containerDiskInGb: 20, volumeInGb: 0,
    }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("権限");
  });

  // 41
  it("pod_list should show GPU count for multi-GPU pods", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "Multi", desiredStatus: "RUNNING", gpuTypeId: "A100", gpuCount: 8, imageName: "img", costPerHr: 10.0, containerDiskInGb: 100, volumeInGb: 500 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("x8");
  });

  // 42
  it("pod_list should show multiple pods", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "First", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "img1", costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0 },
      { id: "p2", name: "Second", desiredStatus: "EXITED", gpuTypeId: "A100", gpuCount: 4, imageName: "img2", costPerHr: 3.0, containerDiskInGb: 50, volumeInGb: 100 },
      { id: "p3", name: "Third", desiredStatus: "RUNNING", gpuTypeId: "H100", gpuCount: 1, imageName: "img3", costPerHr: 2.0, containerDiskInGb: 20, volumeInGb: 0 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("3件");
    expect(result.content[0].text).toContain("First");
    expect(result.content[0].text).toContain("Second");
    expect(result.content[0].text).toContain("Third");
  });

  // 43
  it("pod_get should show volume size", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0.5, containerDiskInGb: 50, volumeInGb: 200,
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("200GB");
  });

  // 44
  it("pod_get should show N/A for uptime when not available", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "EXITED",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0, containerDiskInGb: 20, volumeInGb: 0,
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("N/A");
  });

  // 45
  it("pod_create should show disk and volume sizes", async () => {
    const server = createMockServer();
    registerPodCreate(server as any);
    mockOk({
      id: "p1", name: "T", gpuTypeId: "A6000",
      gpuCount: 1, imageName: "img",
      costPerHr: 0.5, containerDiskInGb: 100, volumeInGb: 500,
    });
    const result = await server.callTool("pod_create", {
      name: "T", imageName: "img", gpuTypeId: "A6000",
      gpuCount: 1, containerDiskInGb: 100, volumeInGb: 500,
    }) as any;
    expect(result.content[0].text).toContain("100GB");
    expect(result.content[0].text).toContain("500GB");
  });

  // 46
  it("pod_list should show disk info", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockOk([
      { id: "p1", name: "T", desiredStatus: "RUNNING", gpuTypeId: "A6000", gpuCount: 1, imageName: "i", costPerHr: 0.5, containerDiskInGb: 75, volumeInGb: 150 },
    ]);
    const result = await server.callTool("pod_list") as any;
    expect(result.content[0].text).toContain("75GB");
    expect(result.content[0].text).toContain("150GB");
  });

  // 47
  it("pod_get should show multiple GPU utilization", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A100", gpuCount: 2, imageName: "i",
      costPerHr: 5.0, containerDiskInGb: 20, volumeInGb: 0,
      runtime: {
        gpus: [
          { id: "0", gpuUtilPercent: 90, memoryUtilPercent: 70 },
          { id: "1", gpuUtilPercent: 85, memoryUtilPercent: 65 },
        ],
      },
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("GPU 0");
    expect(result.content[0].text).toContain("GPU 1");
  });

  // 48
  it("pod_get should handle GPU with N/A utilization", async () => {
    const server = createMockServer();
    registerPodGet(server as any);
    mockOk({
      id: "p1", name: "T", desiredStatus: "RUNNING",
      gpuTypeId: "A6000", gpuCount: 1, imageName: "i",
      costPerHr: 0.5, containerDiskInGb: 20, volumeInGb: 0,
      runtime: { gpus: [{ id: "0" }] },
    });
    const result = await server.callTool("pod_get", { podId: "p1" }) as any;
    expect(result.content[0].text).toContain("N/A");
  });

  // 49
  it("pod_stop should handle rate limit error", async () => {
    const server = createMockServer();
    registerPodStop(server as any);
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    const result = await server.callTool("pod_stop", { podId: "p1" }) as any;
    expect(result.isError).toBe(true);
  });

  // 50
  it("pod_list should handle forbidden error", async () => {
    const server = createMockServer();
    registerPodList(server as any);
    mockError(403, "Forbidden");
    const result = await server.callTool("pod_list") as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("権限");
  });
});
