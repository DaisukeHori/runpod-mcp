/**
 * GPU・アカウント MCP ツール 結合テスト (40件)
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

import { registerGpuTypes } from "@/lib/mcp/tools/gpu-types";
import { registerAccountInfo } from "@/lib/mcp/tools/account-info";

beforeEach(() => { mockFetch.mockReset(); });

// ── gpu_types ──

describe("gpu_types tool", () => {
  // 1
  it("should register correctly", () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    expect(s.tools).toHaveProperty("gpu_types");
  });

  // 2
  it("should return GPU list", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A6000", displayName: "NVIDIA RTX A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: { uninterruptablePrice: 0.74, minimumBidPrice: 0.3 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("NVIDIA RTX A6000");
  });

  // 3
  it("should show VRAM", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A100", displayName: "A100 80GB", memoryInGb: 80, secureCloud: true, communityCloud: false, lowestPrice: { uninterruptablePrice: 2.0 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("80GB");
  });

  // 4
  it("should show on-demand price", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A6000", displayName: "A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: { uninterruptablePrice: 0.74, minimumBidPrice: 0.3 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("$0.74/hr");
  });

  // 5
  it("should show spot price", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A6000", displayName: "A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: { uninterruptablePrice: 0.74, minimumBidPrice: 0.3 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("$0.3/hr");
  });

  // 6
  it("should show N/A for missing prices", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "H100", displayName: "H100", memoryInGb: 80, secureCloud: true, communityCloud: false, lowestPrice: {} },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("N/A");
  });

  // 7
  it("should show cloud type labels", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A6000", displayName: "A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: { uninterruptablePrice: 0.74 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("Secure");
    expect(r.content[0].text).toContain("Community");
  });

  // 8
  it("should show only Secure when no community", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "H100", displayName: "H100", memoryInGb: 80, secureCloud: true, communityCloud: false, lowestPrice: { uninterruptablePrice: 3.0 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("Secure");
    expect(r.content[0].text).not.toMatch(/Community.*H100|H100.*Community/);
  });

  // 9
  it("should sort by VRAM", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "A100", displayName: "A100", memoryInGb: 80, secureCloud: true, communityCloud: true, lowestPrice: {} },
      { id: "A6000", displayName: "A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: {} },
      { id: "RTX3090", displayName: "RTX 3090", memoryInGb: 24, secureCloud: false, communityCloud: true, lowestPrice: {} },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    const text = r.content[0].text;
    const idx3090 = text.indexOf("RTX 3090");
    const idxA6000 = text.indexOf("A6000");
    const idxA100 = text.indexOf("A100");
    expect(idx3090).toBeLessThan(idxA6000);
    expect(idxA6000).toBeLessThan(idxA100);
  });

  // 10
  it("should show count", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "a", displayName: "A", memoryInGb: 10, secureCloud: true, communityCloud: true, lowestPrice: {} },
      { id: "b", displayName: "B", memoryInGb: 20, secureCloud: true, communityCloud: true, lowestPrice: {} },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("2種");
  });

  // 11
  it("should show empty message", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("取得できませんでした");
  });

  // 12
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("gpu_types") as any;
    expect(r.isError).toBe(true);
  });

  // 13
  it("should handle graphql error", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: null, errors: [{ message: "Query failed" }] });
    const r = await s.callTool("gpu_types") as any;
    expect(r.isError).toBe(true);
  });

  // 14
  it("should show GPU ID", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "NVIDIA RTX A6000", displayName: "NVIDIA RTX A6000", memoryInGb: 48, secureCloud: true, communityCloud: true, lowestPrice: {} },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("NVIDIA RTX A6000");
  });

  // 15
  it("should handle network error", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const r = await s.callTool("gpu_types") as any;
    expect(r.isError).toBe(true);
  });

  // 16
  it("should use text content type", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].type).toBe("text");
  });

  // 17
  it("should handle many GPU types", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    const gpus = Array.from({ length: 20 }, (_, i) => ({
      id: `gpu-${i}`, displayName: `GPU ${i}`, memoryInGb: (i + 1) * 4,
      secureCloud: true, communityCloud: true, lowestPrice: { uninterruptablePrice: i * 0.5 },
    }));
    mockOk({ data: { gpuTypes: gpus } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("20種");
  });
});

// ── account_info ──

describe("account_info tool", () => {
  // 18
  it("should register correctly", () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    expect(s.tools).toHaveProperty("account_info");
  });

  // 19
  it("should return account details", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "user1", email: "test@example.com",
      clientBalance: 100.50, hostBalance: 0,
      currentSpendPerHr: 0.74, spendLimit: 500,
      machineQuota: 10, underBalance: false,
      multiFactorEnabled: true, referralEarned: 5.00,
      templateEarned: 2.50, signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("test@example.com");
  });

  // 20
  it("should show balance", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 250.75,
      hostBalance: 10.00, currentSpendPerHr: 1.5,
      spendLimit: 1000, machineQuota: 20,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("$250.75");
  });

  // 21
  it("should show spend per hour", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 2.3456,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("$2.3456/hr");
  });

  // 22
  it("should show under balance warning", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 0.50,
      hostBalance: 0, currentSpendPerHr: 3.0,
      spendLimit: 100, machineQuota: 5,
      underBalance: true, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("⚠️");
  });

  // 23
  it("should show MFA enabled status", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: true,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("有効");
  });

  // 24
  it("should show MFA disabled status", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("無効");
  });

  // 25
  it("should show machine quota", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 25,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("25");
  });

  // 26
  it("should show spend limit", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 750, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("$750");
  });

  // 27
  it("should show referral earnings", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 15.50, templateEarned: 3.25,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("$15.50");
    expect(r.content[0].text).toContain("$3.25");
  });

  // 28
  it("should show host balance", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 42.00, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("$42.00");
  });

  // 29
  it("should handle auth error", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockError(401, "Unauthorized");
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("API キー");
  });

  // 30
  it("should handle graphql error", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: null, errors: [{ message: "Auth required" }] });
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
  });

  // 31
  it("should handle network error", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
  });

  // 32
  it("should use text content type", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 0,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 0, machineQuota: 0,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].type).toBe("text");
  });

  // 33
  it("should show 'いいえ' for not under balance", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 500,
      hostBalance: 0, currentSpendPerHr: 0.5,
      spendLimit: 1000, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("いいえ");
  });

  // 34
  it("should handle server error", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockError(500, "Internal error");
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
  });

  // 35
  it("should show account info header", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockOk({ data: { myself: {
      id: "u1", email: "a@b.com", clientBalance: 100,
      hostBalance: 0, currentSpendPerHr: 0,
      spendLimit: 500, machineQuota: 10,
      underBalance: false, multiFactorEnabled: false,
      referralEarned: 0, templateEarned: 0,
      signedTermsOfService: true,
    } } });
    const r = await s.callTool("account_info") as any;
    expect(r.content[0].text).toContain("RunPod アカウント情報");
  });
});

// ── 共通パターン ──

describe("gpu/account tools common", () => {
  // 36
  it("gpu_types handles unexpected error type", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockFetch.mockRejectedValueOnce(null);
    const r = await s.callTool("gpu_types") as any;
    expect(r.isError).toBe(true);
  });

  // 37
  it("account_info handles unexpected error type", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockFetch.mockRejectedValueOnce("error string");
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
  });

  // 38
  it("gpu_types handles rate limit", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    mockError(429, "Rate limit");
    const r = await s.callTool("gpu_types") as any;
    expect(r.isError).toBe(true);
  });

  // 39
  it("account_info handles permission error", async () => {
    const s = createMockServer();
    registerAccountInfo(s as any);
    mockError(403, "Forbidden");
    const r = await s.callTool("account_info") as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("権限");
  });

  // 40
  it("gpu_types with community-only GPU", async () => {
    const s = createMockServer();
    registerGpuTypes(s as any);
    mockOk({ data: { gpuTypes: [
      { id: "RTX3090", displayName: "RTX 3090", memoryInGb: 24, secureCloud: false, communityCloud: true, lowestPrice: { minimumBidPrice: 0.2 } },
    ] } });
    const r = await s.callTool("gpu_types") as any;
    expect(r.content[0].text).toContain("Community");
  });
});
