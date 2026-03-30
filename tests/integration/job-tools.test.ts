/**
 * Job MCP ツール 結合テスト (50件)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true, status: 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });
}

function mockError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false, status, statusText: message,
    json: () => Promise.resolve({ error: message }),
    headers: new Headers(),
  });
}

function createMockServer() {
  const tools: Record<string, { config: unknown; handler: (...args: unknown[]) => Promise<unknown> }> = {};
  return {
    registerTool: (name: string, config: unknown, handler: (...args: unknown[]) => Promise<unknown>) => {
      tools[name] = { config, handler };
    },
    tools,
    callTool: async (name: string, args: Record<string, unknown> = {}) => tools[name].handler(args),
  };
}

import { registerJobRun } from "@/lib/mcp/tools/job-run";
import { registerJobRunSync } from "@/lib/mcp/tools/job-runsync";
import { registerJobStatus } from "@/lib/mcp/tools/job-status";
import { registerJobCancel } from "@/lib/mcp/tools/job-cancel";

beforeEach(() => { mockFetch.mockReset(); });

// ── job_run ──

describe("job_run tool", () => {
  // 1
  it("should register correctly", () => {
    const s = createMockServer();
    registerJobRun(s as any);
    expect(s.tools).toHaveProperty("job_run");
  });

  // 2
  it("should submit async job", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "job-1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: { prompt: "hello" },
    }) as any;
    expect(r.content[0].text).toContain("送信しました");
    expect(r.content[0].text).toContain("job-1");
  });

  // 3
  it("should show status IN_QUEUE", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("IN_QUEUE");
  });

  // 4
  it("should mention job_status tool", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("job_status");
  });

  // 5
  it("should handle webhook parameter", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: { data: "test" },
      webhook: "https://example.com/webhook",
    }) as any;
    expect(r.content[0].text).toContain("送信しました");
  });

  // 6
  it("should handle executionTimeout parameter", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {}, executionTimeout: 300,
    }) as any;
    expect(r.content[0].text).toContain("送信しました");
  });

  // 7
  it("should handle error", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockError(400, "Invalid input");
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 8
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("API キー");
  });

  // 9
  it("should handle complex input", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", {
      endpointId: "ep1",
      input: { images: ["img1.png"], settings: { quality: 0.9, size: [512, 512] } },
    }) as any;
    expect(r.content[0].text).toContain("送信しました");
  });

  // 10
  it("should handle network error", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const r = await s.callTool("job_run", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.isError).toBe(true);
  });
});

// ── job_runsync ──

describe("job_runsync tool", () => {
  // 11
  it("should register correctly", () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    expect(s.tools).toHaveProperty("job_runsync");
  });

  // 12
  it("should return completed job result", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({
      id: "j1", status: "COMPLETED",
      output: { result: "generated text" },
      executionTime: 1500,
    });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: { prompt: "test" },
    }) as any;
    expect(r.content[0].text).toContain("完了");
    expect(r.content[0].text).toContain("generated text");
  });

  // 13
  it("should show execution time", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({
      id: "j1", status: "COMPLETED", output: {},
      executionTime: 2500,
    });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("2500ms");
  });

  // 14
  it("should show delay time", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({
      id: "j1", status: "COMPLETED", output: {},
      delayTime: 500,
    });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("500ms");
  });

  // 15
  it("should show error in output", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({
      id: "j1", status: "FAILED",
      error: "Out of memory",
    });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("Out of memory");
  });

  // 16
  it("should format output as JSON", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({
      id: "j1", status: "COMPLETED",
      output: { key: "value" },
    });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("```json");
  });

  // 17
  it("should handle timeout parameter", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: {} });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {}, executionTimeout: 60,
    }) as any;
    expect(r.content[0].text).toContain("完了");
  });

  // 18
  it("should handle API error", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockError(500, "Server error");
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 19
  it("should handle TIMED_OUT status", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({ id: "j1", status: "TIMED_OUT" });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("TIMED_OUT");
  });

  // 20
  it("should show job ID", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({ id: "job-xyz-456", status: "COMPLETED", output: {} });
    const r = await s.callTool("job_runsync", {
      endpointId: "ep1", input: {},
    }) as any;
    expect(r.content[0].text).toContain("job-xyz-456");
  });
});

// ── job_status ──

describe("job_status tool", () => {
  // 21
  it("should register correctly", () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    expect(s.tools).toHaveProperty("job_status");
  });

  // 22
  it("should show IN_QUEUE status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("キュー待ち");
  });

  // 23
  it("should show IN_PROGRESS status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "IN_PROGRESS" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("実行中");
  });

  // 24
  it("should show COMPLETED status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: { result: 42 } });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("完了");
  });

  // 25
  it("should show FAILED status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "FAILED", error: "OOM" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("失敗");
  });

  // 26
  it("should show CANCELLED status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "CANCELLED" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("キャンセル");
  });

  // 27
  it("should show TIMED_OUT status", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "TIMED_OUT" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("タイムアウト");
  });

  // 28
  it("should show execution time", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "COMPLETED", executionTime: 3000, output: {} });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("3000ms");
  });

  // 29
  it("should show delay time", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "COMPLETED", delayTime: 200, output: {} });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("200ms");
  });

  // 30
  it("should show error message", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "FAILED", error: "GPU memory exceeded" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("GPU memory exceeded");
  });

  // 31
  it("should show JSON output", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: { images: ["url1"] } });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("```json");
    expect(r.content[0].text).toContain("url1");
  });

  // 32
  it("should handle 404 error", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockError(404, "Job not found");
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "bad",
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 33
  it("should show job ID in response", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "job-abc-123", status: "IN_PROGRESS" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "job-abc-123",
    }) as any;
    expect(r.content[0].text).toContain("job-abc-123");
  });

  // 34
  it("should handle unknown status gracefully", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "UNKNOWN_STATUS" });
    const r = await s.callTool("job_status", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("UNKNOWN_STATUS");
  });
});

// ── job_cancel ──

describe("job_cancel tool", () => {
  // 35
  it("should register correctly", () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    expect(s.tools).toHaveProperty("job_cancel");
  });

  // 36
  it("should cancel job successfully", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockOk({});
    const r = await s.callTool("job_cancel", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.content[0].text).toContain("キャンセルしました");
  });

  // 37
  it("should include job ID in message", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockOk({});
    const r = await s.callTool("job_cancel", {
      endpointId: "ep1", jobId: "job-xyz",
    }) as any;
    expect(r.content[0].text).toContain("job-xyz");
  });

  // 38
  it("should handle 404 error", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockError(404, "Job not found");
    const r = await s.callTool("job_cancel", {
      endpointId: "ep1", jobId: "bad",
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 39
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("job_cancel", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 40
  it("should handle server error", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockError(500, "Internal error");
    const r = await s.callTool("job_cancel", {
      endpointId: "ep1", jobId: "j1",
    }) as any;
    expect(r.isError).toBe(true);
  });
});

// ── Job ツール共通 ──

describe("job tools common patterns", () => {
  // 41
  it("all job tools use text content type", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_run", { endpointId: "ep1", input: {} }) as any;
    expect(r.content[0].type).toBe("text");
  });

  // 42
  it("job_runsync with null output", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: null });
    const r = await s.callTool("job_runsync", { endpointId: "ep1", input: {} }) as any;
    expect(r.content[0].text).toContain("null");
  });

  // 43
  it("job_status without output shows no JSON block", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "IN_QUEUE" });
    const r = await s.callTool("job_status", { endpointId: "ep1", jobId: "j1" }) as any;
    expect(r.content[0].text).not.toContain("```json");
  });

  // 44
  it("job_run handles unexpected error type", async () => {
    const s = createMockServer();
    registerJobRun(s as any);
    mockFetch.mockRejectedValueOnce("string error");
    const r = await s.callTool("job_run", { endpointId: "ep1", input: {} }) as any;
    expect(r.isError).toBe(true);
  });

  // 45
  it("job_cancel handles unexpected error type", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockFetch.mockRejectedValueOnce(undefined);
    const r = await s.callTool("job_cancel", { endpointId: "ep1", jobId: "j1" }) as any;
    expect(r.isError).toBe(true);
  });

  // 46
  it("job_status handles permission error", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockError(403, "Forbidden");
    const r = await s.callTool("job_status", { endpointId: "ep1", jobId: "j1" }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("権限");
  });

  // 47
  it("job_runsync handles network error", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockFetch.mockRejectedValueOnce(new Error("ECONNRESET"));
    const r = await s.callTool("job_runsync", { endpointId: "ep1", input: {} }) as any;
    expect(r.isError).toBe(true);
  });

  // 48
  it("job_runsync without execution time omits it", async () => {
    const s = createMockServer();
    registerJobRunSync(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: {} });
    const r = await s.callTool("job_runsync", { endpointId: "ep1", input: {} }) as any;
    expect(r.content[0].text).not.toContain("実行時間");
  });

  // 49
  it("job_status without delay time omits it", async () => {
    const s = createMockServer();
    registerJobStatus(s as any);
    mockOk({ id: "j1", status: "COMPLETED", output: {} });
    const r = await s.callTool("job_status", { endpointId: "ep1", jobId: "j1" }) as any;
    expect(r.content[0].text).not.toContain("待機時間");
  });

  // 50
  it("job_cancel handles rate limit", async () => {
    const s = createMockServer();
    registerJobCancel(s as any);
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    const r = await s.callTool("job_cancel", { endpointId: "ep1", jobId: "j1" }) as any;
    expect(r.isError).toBe(true);
  });
});
