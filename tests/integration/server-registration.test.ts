/**
 * MCP サーバー登録 結合テスト (20件)
 *
 * 全ツールが正しく登録されることを検証する
 */
import { describe, it, expect, vi } from "vitest";

// CLI モック (execFile)
const mockExecFile = vi.hoisted(() => vi.fn());
vi.mock("child_process", () => ({
  execFile: mockExecFile,
}));
vi.mock("util", () => ({
  promisify: () => mockExecFile,
}));

import { registerAllTools } from "@/lib/mcp/server";

function createMockServer() {
  const tools: Record<string, { config: unknown; handler: unknown }> = {};
  return {
    registerTool: (name: string, config: unknown, handler: unknown) => {
      tools[name] = { config, handler };
    },
    tools,
  };
}

describe("registerAllTools", () => {
  const server = createMockServer();
  registerAllTools(server as any);

  // 1
  it("should register pod_list", () => {
    expect(server.tools).toHaveProperty("pod_list");
  });

  // 2
  it("should register pod_get", () => {
    expect(server.tools).toHaveProperty("pod_get");
  });

  // 3
  it("should register pod_create", () => {
    expect(server.tools).toHaveProperty("pod_create");
  });

  // 4
  it("should register pod_stop", () => {
    expect(server.tools).toHaveProperty("pod_stop");
  });

  // 5
  it("should register pod_terminate", () => {
    expect(server.tools).toHaveProperty("pod_terminate");
  });

  // 6
  it("should register endpoint_list", () => {
    expect(server.tools).toHaveProperty("endpoint_list");
  });

  // 7
  it("should register endpoint_get", () => {
    expect(server.tools).toHaveProperty("endpoint_get");
  });

  // 8
  it("should register endpoint_create", () => {
    expect(server.tools).toHaveProperty("endpoint_create");
  });

  // 9
  it("should register endpoint_update", () => {
    expect(server.tools).toHaveProperty("endpoint_update");
  });

  // 10
  it("should register job_run", () => {
    expect(server.tools).toHaveProperty("job_run");
  });

  // 11
  it("should register job_runsync", () => {
    expect(server.tools).toHaveProperty("job_runsync");
  });

  // 12
  it("should register job_status", () => {
    expect(server.tools).toHaveProperty("job_status");
  });

  // 13
  it("should register job_cancel", () => {
    expect(server.tools).toHaveProperty("job_cancel");
  });

  // 14
  it("should register gpu_types", () => {
    expect(server.tools).toHaveProperty("gpu_types");
  });

  // 15
  it("should register account_info", () => {
    expect(server.tools).toHaveProperty("account_info");
  });

  // 16
  it("should register cli_send_file", () => {
    expect(server.tools).toHaveProperty("cli_send_file");
  });

  // 17
  it("should register cli_receive_file", () => {
    expect(server.tools).toHaveProperty("cli_receive_file");
  });

  // 18
  it("should register cli_ssh_add_key", () => {
    expect(server.tools).toHaveProperty("cli_ssh_add_key");
  });

  // 19
  it("should register cli_ssh_connect", () => {
    expect(server.tools).toHaveProperty("cli_ssh_connect");
  });

  // 20
  it("should register cli_doctor", () => {
    expect(server.tools).toHaveProperty("cli_doctor");
  });
});
