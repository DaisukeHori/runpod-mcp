/**
 * Endpoint MCP ツール 結合テスト (50件)
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

function mockOk(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true, status,
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

import { registerEndpointList } from "@/lib/mcp/tools/endpoint-list";
import { registerEndpointGet } from "@/lib/mcp/tools/endpoint-get";
import { registerEndpointCreate } from "@/lib/mcp/tools/endpoint-create";
import { registerEndpointUpdate } from "@/lib/mcp/tools/endpoint-update";

beforeEach(() => { mockFetch.mockReset(); });

// ── endpoint_list ──

describe("endpoint_list tool", () => {
  // 1
  it("should register correctly", () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    expect(s.tools).toHaveProperty("endpoint_list");
  });

  // 2
  it("should return endpoint list", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep1", name: "Endpoint 1", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("Endpoint 1");
  });

  // 3
  it("should show count in header", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep1", name: "A", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
      { id: "ep2", name: "B", gpuIds: "A100", workersMin: 1, workersMax: 5, idleTimeout: 10 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("2件");
  });

  // 4
  it("should show empty message", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("見つかりませんでした");
  });

  // 5
  it("should show worker range", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep1", name: "Test", gpuIds: "A6000", workersMin: 2, workersMax: 10, idleTimeout: 30 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("2〜10");
  });

  // 6
  it("should show idle timeout", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep1", name: "Test", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 60 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("60秒");
  });

  // 7
  it("should show GPU ids", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep1", name: "Test", gpuIds: "NVIDIA RTX A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("NVIDIA RTX A6000");
  });

  // 8
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("endpoint_list") as any;
    expect(r.isError).toBe(true);
  });

  // 9
  it("should show endpoint IDs", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "ep-abc-123", name: "Test", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("ep-abc-123");
  });

  // 10
  it("should handle network error", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const r = await s.callTool("endpoint_list") as any;
    expect(r.isError).toBe(true);
  });

  // 11
  it("should handle multiple endpoints", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "e1", name: "Alpha", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
      { id: "e2", name: "Beta", gpuIds: "A100", workersMin: 1, workersMax: 5, idleTimeout: 10 },
      { id: "e3", name: "Gamma", gpuIds: "H100", workersMin: 0, workersMax: 1, idleTimeout: 30 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("Alpha");
    expect(r.content[0].text).toContain("Beta");
    expect(r.content[0].text).toContain("Gamma");
    expect(r.content[0].text).toContain("3件");
  });
});

// ── endpoint_get ──

describe("endpoint_get tool", () => {
  // 12
  it("should register correctly", () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    expect(s.tools).toHaveProperty("endpoint_get");
  });

  // 13
  it("should return endpoint details", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "My Endpoint", gpuIds: "A6000",
      templateId: "tmpl-1", workersMin: 0, workersMax: 3,
      idleTimeout: 5, locations: "US", networkVolumeId: "vol-1",
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("My Endpoint");
    expect(r.content[0].text).toContain("ep1");
  });

  // 14
  it("should show template ID", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      templateId: "tmpl-abc", workersMin: 0, workersMax: 3,
      idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("tmpl-abc");
  });

  // 15
  it("should show N/A for missing template", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("N/A");
  });

  // 16
  it("should show location", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
      locations: "EU-RO-1",
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("EU-RO-1");
  });

  // 17
  it("should show '自動' for no location", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("自動");
  });

  // 18
  it("should show network volume", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
      networkVolumeId: "nv-xyz",
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("nv-xyz");
  });

  // 19
  it("should show 'なし' for no network volume", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("なし");
  });

  // 20
  it("should handle 404", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockError(404, "Not found");
    const r = await s.callTool("endpoint_get", { endpointId: "bad" }) as any;
    expect(r.isError).toBe(true);
  });

  // 21
  it("should show worker range", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 5, workersMax: 20, idleTimeout: 60,
    });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("5〜20");
  });
});

// ── endpoint_create ──

describe("endpoint_create tool", () => {
  // 22
  it("should register correctly", () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    expect(s.tools).toHaveProperty("endpoint_create");
  });

  // 23
  it("should create endpoint successfully", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockOk({
      id: "ep-new", name: "New EP", gpuIds: "A6000",
      workersMin: 0, workersMax: 3,
    });
    const r = await s.callTool("endpoint_create", {
      name: "New EP", templateId: "tmpl-1", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.content[0].text).toContain("作成しました");
    expect(r.content[0].text).toContain("New EP");
  });

  // 24
  it("should show GPU info in response", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockOk({
      id: "ep-new", name: "T", gpuIds: "NVIDIA A100",
      workersMin: 1, workersMax: 10,
    });
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "tmpl", gpuIds: "NVIDIA A100",
      workersMin: 1, workersMax: 10, idleTimeout: 30,
    }) as any;
    expect(r.content[0].text).toContain("NVIDIA A100");
  });

  // 25
  it("should show worker range in response", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockOk({
      id: "ep-new", name: "T", gpuIds: "A6000",
      workersMin: 2, workersMax: 8,
    });
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "tmpl", gpuIds: "A6000",
      workersMin: 2, workersMax: 8, idleTimeout: 5,
    }) as any;
    expect(r.content[0].text).toContain("2〜8");
  });

  // 26
  it("should handle creation error", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockError(400, "Invalid template");
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "bad", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 27
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "t", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("API キー");
  });

  // 28
  it("should show endpoint ID in response", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockOk({
      id: "ep-xyz-789", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3,
    });
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "t", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.content[0].text).toContain("ep-xyz-789");
  });
});

// ── endpoint_update ──

describe("endpoint_update tool", () => {
  // 29
  it("should register correctly", () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    expect(s.tools).toHaveProperty("endpoint_update");
  });

  // 30
  it("should update name", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep1", name: "Updated Name", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", name: "Updated Name",
    }) as any;
    expect(r.content[0].text).toContain("更新しました");
    expect(r.content[0].text).toContain("Updated Name");
  });

  // 31
  it("should update workers", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 5, workersMax: 15, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", workersMin: 5, workersMax: 15,
    }) as any;
    expect(r.content[0].text).toContain("5〜15");
  });

  // 32
  it("should update GPU", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "NVIDIA H100",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", gpuIds: "NVIDIA H100",
    }) as any;
    expect(r.content[0].text).toContain("NVIDIA H100");
  });

  // 33
  it("should update idle timeout", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 120,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", idleTimeout: 120,
    }) as any;
    expect(r.content[0].text).toContain("120秒");
  });

  // 34
  it("should handle 404", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockError(404, "Endpoint not found");
    const r = await s.callTool("endpoint_update", {
      endpointId: "bad", name: "X",
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 35
  it("should handle server error", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockError(500, "Internal error");
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", name: "X",
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 36
  it("should show endpoint ID in response", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep-abc", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep-abc", name: "T",
    }) as any;
    expect(r.content[0].text).toContain("ep-abc");
  });

  // 37
  it("should handle permission error", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockError(403, "Forbidden");
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1", name: "X",
    }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("権限");
  });

  // 38
  it("should handle update with no changes (all undefined)", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({
      id: "ep1", name: "T", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    });
    const r = await s.callTool("endpoint_update", {
      endpointId: "ep1",
    }) as any;
    expect(r.content[0].text).toContain("更新しました");
  });
});

// ── Endpoint ツール共通 ──

describe("endpoint tools common patterns", () => {
  // 39
  it("endpoint_list uses text content type", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].type).toBe("text");
  });

  // 40
  it("endpoint_get uses text content type", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({ id: "ep1", name: "T", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].type).toBe("text");
  });

  // 41
  it("endpoint_create uses text content type", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockOk({ id: "ep1", name: "T", gpuIds: "A6000", workersMin: 0, workersMax: 3 });
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "t", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.content[0].type).toBe("text");
  });

  // 42
  it("endpoint_update uses text content type", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({ id: "ep1", name: "T", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 });
    const r = await s.callTool("endpoint_update", { endpointId: "ep1", name: "T" }) as any;
    expect(r.content[0].type).toBe("text");
  });

  // 43
  it("endpoint_list handles unexpected error type", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockFetch.mockRejectedValueOnce("plain string error");
    const r = await s.callTool("endpoint_list") as any;
    expect(r.isError).toBe(true);
  });

  // 44
  it("endpoint_get handles unexpected error type", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockFetch.mockRejectedValueOnce(42);
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.isError).toBe(true);
  });

  // 45
  it("endpoint_create handles rate limit", async () => {
    const s = createMockServer();
    registerEndpointCreate(s as any);
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    mockError(429, "Too many requests");
    const r = await s.callTool("endpoint_create", {
      name: "T", templateId: "t", gpuIds: "A6000",
      workersMin: 0, workersMax: 3, idleTimeout: 5,
    }) as any;
    expect(r.isError).toBe(true);
  });

  // 46
  it("endpoint_list shows numbered list", async () => {
    const s = createMockServer();
    registerEndpointList(s as any);
    mockOk([
      { id: "e1", name: "First", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 5 },
      { id: "e2", name: "Second", gpuIds: "A100", workersMin: 1, workersMax: 5, idleTimeout: 10 },
    ]);
    const r = await s.callTool("endpoint_list") as any;
    expect(r.content[0].text).toContain("1.");
    expect(r.content[0].text).toContain("2.");
  });

  // 47
  it("endpoint_get shows idle timeout in seconds", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    mockOk({ id: "ep1", name: "T", gpuIds: "A6000", workersMin: 0, workersMax: 3, idleTimeout: 300 });
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.content[0].text).toContain("300秒");
  });

  // 48
  it("endpoint_update shows updated GPU in response", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockOk({ id: "ep1", name: "T", gpuIds: "RTX 4090", workersMin: 0, workersMax: 3, idleTimeout: 5 });
    const r = await s.callTool("endpoint_update", { endpointId: "ep1", gpuIds: "RTX 4090" }) as any;
    expect(r.content[0].text).toContain("RTX 4090");
  });

  // 49
  it("endpoint_get handles server error with user message", async () => {
    const s = createMockServer();
    registerEndpointGet(s as any);
    // 502 triggers retries, so provide enough mocks
    mockError(502, "Bad Gateway");
    mockError(502, "Bad Gateway");
    mockError(502, "Bad Gateway");
    mockError(502, "Bad Gateway");
    const r = await s.callTool("endpoint_get", { endpointId: "ep1" }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("エラー");
  });

  // 50
  it("endpoint_update handles network failure", async () => {
    const s = createMockServer();
    registerEndpointUpdate(s as any);
    mockFetch.mockRejectedValueOnce(new Error("ETIMEDOUT"));
    const r = await s.callTool("endpoint_update", { endpointId: "ep1", name: "X" }) as any;
    expect(r.isError).toBe(true);
  });
});
