/**
 * CLI MCP ツール 結合テスト (40件)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// execFile モック
const mockExecFile = vi.hoisted(() => vi.fn());
vi.mock("child_process", () => ({
  execFile: mockExecFile,
}));
vi.mock("util", () => ({
  promisify: () => mockExecFile,
}));

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

function mockSuccess(stdout: string, stderr = "") {
  mockExecFile.mockResolvedValueOnce({ stdout, stderr });
}

function mockFailure(stderr: string, code = 1) {
  const error = new Error("fail") as any;
  error.stdout = "";
  error.stderr = stderr;
  error.code = code;
  error.killed = false;
  mockExecFile.mockRejectedValueOnce(error);
}

function mockNotInstalled() {
  const error = new Error("not found") as any;
  error.stdout = "";
  error.stderr = "command not found";
  error.code = 127;
  error.killed = false;
  mockExecFile.mockRejectedValueOnce(error);
}

import { registerCliSendFile } from "@/lib/mcp/tools/cli-send-file";
import { registerCliReceiveFile } from "@/lib/mcp/tools/cli-receive-file";
import { registerCliSshAddKey, registerCliSshConnect } from "@/lib/mcp/tools/cli-ssh";
import { registerCliDoctor } from "@/lib/mcp/tools/cli-doctor";

beforeEach(() => { mockExecFile.mockReset(); });

// ── cli_send_file ──

describe("cli_send_file tool", () => {
  // 1
  it("should register correctly", () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    expect(s.tools).toHaveProperty("cli_send_file");
  });

  // 2
  it("should send file and return code", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    // isCliInstalled check
    mockSuccess("runpodctl v1.0.0");
    // sendFile
    mockSuccess("Sending...\nCode is: abc-123-def\nDone.");
    const r = await s.callTool("cli_send_file", { filePath: "/tmp/data.tar.gz" }) as any;
    expect(r.content[0].text).toContain("abc-123-def");
    expect(r.content[0].text).toContain("送信準備完了");
  });

  // 3
  it("should show error when CLI not installed", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_send_file", { filePath: "/tmp/file" }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("インストールされていません");
  });

  // 4
  it("should show file path in response", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Code is: xyz-789");
    const r = await s.callTool("cli_send_file", { filePath: "/home/user/model.bin" }) as any;
    expect(r.content[0].text).toContain("/home/user/model.bin");
  });

  // 5
  it("should show receive command", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Code is: test-code-123");
    const r = await s.callTool("cli_send_file", { filePath: "/file" }) as any;
    expect(r.content[0].text).toContain("runpodctl receive test-code-123");
  });

  // 6
  it("should handle send failure", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockFailure("file not found");
    const r = await s.callTool("cli_send_file", { filePath: "/nonexistent" }) as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("ファイル送信に失敗");
  });

  // 7
  it("should show install instructions when not installed", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_send_file", { filePath: "/file" }) as any;
    expect(r.content[0].text).toContain("cli.runpod.net");
  });
});

// ── cli_receive_file ──

describe("cli_receive_file tool", () => {
  // 8
  it("should register correctly", () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    expect(s.tools).toHaveProperty("cli_receive_file");
  });

  // 9
  it("should receive file successfully", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Received model.bin (2.5GB)");
    const r = await s.callTool("cli_receive_file", { code: "abc-123" }) as any;
    expect(r.content[0].text).toContain("受信しました");
    expect(r.content[0].text).toContain("model.bin");
  });

  // 10
  it("should show error when CLI not installed", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_receive_file", { code: "abc" }) as any;
    expect(r.isError).toBe(true);
  });

  // 11
  it("should handle invalid code", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockFailure("invalid transfer code");
    const r = await s.callTool("cli_receive_file", { code: "bad-code" }) as any;
    expect(r.isError).toBe(true);
  });

  // 12
  it("should handle receive timeout", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    const error = new Error("timeout") as any;
    error.stdout = "";
    error.stderr = "";
    error.killed = true;
    mockExecFile.mockRejectedValueOnce(error);
    const r = await s.callTool("cli_receive_file", { code: "abc-123" }) as any;
    expect(r.isError).toBe(true);
  });
});

// ── cli_ssh_add_key ──

describe("cli_ssh_add_key tool", () => {
  // 13
  it("should register correctly", () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    expect(s.tools).toHaveProperty("cli_ssh_add_key");
  });

  // 14
  it("should add SSH key successfully", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("SSH key added successfully");
    const r = await s.callTool("cli_ssh_add_key", { publicKey: "ssh-ed25519 AAAA... user@host" }) as any;
    expect(r.content[0].text).toContain("追加しました");
  });

  // 15
  it("should show error when CLI not installed", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_ssh_add_key", { publicKey: "ssh-rsa ..." }) as any;
    expect(r.isError).toBe(true);
  });

  // 16
  it("should handle add key failure", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockFailure("invalid key format");
    const r = await s.callTool("cli_ssh_add_key", { publicKey: "bad-key" }) as any;
    expect(r.isError).toBe(true);
  });

  // 17
  it("should show output from CLI", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Key fingerprint: SHA256:abc123");
    const r = await s.callTool("cli_ssh_add_key", { publicKey: "ssh-ed25519 AAAA..." }) as any;
    expect(r.content[0].text).toContain("SHA256:abc123");
  });
});

// ── cli_ssh_connect ──

describe("cli_ssh_connect tool", () => {
  // 18
  it("should register correctly", () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    expect(s.tools).toHaveProperty("cli_ssh_connect");
  });

  // 19
  it("should get SSH connection info", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("ssh root@1.2.3.4 -p 22000 -i ~/.ssh/id_ed25519");
    const r = await s.callTool("cli_ssh_connect", { podId: "pod-123" }) as any;
    expect(r.content[0].text).toContain("SSH接続情報");
    expect(r.content[0].text).toContain("ssh root@");
  });

  // 20
  it("should show error when CLI not installed", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_ssh_connect", { podId: "pod-1" }) as any;
    expect(r.isError).toBe(true);
  });

  // 21
  it("should handle pod not found", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockFailure("pod not found");
    const r = await s.callTool("cli_ssh_connect", { podId: "bad" }) as any;
    expect(r.isError).toBe(true);
  });

  // 22
  it("should show connection command", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("ssh root@10.0.0.1 -p 443");
    const r = await s.callTool("cli_ssh_connect", { podId: "p1" }) as any;
    expect(r.content[0].text).toContain("10.0.0.1");
  });
});

// ── cli_doctor ──

describe("cli_doctor tool", () => {
  // 23
  it("should register correctly", () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    expect(s.tools).toHaveProperty("cli_doctor");
  });

  // 24
  it("should run diagnostics", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    // isCliInstalled
    mockSuccess("runpodctl v1.2.3");
    // getCliVersion
    mockSuccess("runpodctl v1.2.3");
    // runDoctor
    mockSuccess("CLI: OK\nAPI: OK\nNetwork: OK");
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].text).toContain("診断結果");
    expect(r.content[0].text).toContain("CLI: OK");
  });

  // 25
  it("should show version", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockSuccess("runpodctl v2.0.0");
    mockSuccess("runpodctl v2.0.0");
    mockSuccess("All checks passed");
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].text).toContain("v2.0.0");
  });

  // 26
  it("should show error when CLI not installed", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_doctor") as any;
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("インストールされていません");
  });

  // 27
  it("should show install instructions", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].text).toContain("cli.runpod.net");
  });

  // 28
  it("should show warnings from stderr", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("runpodctl v1.0.0");
    mockExecFile.mockResolvedValueOnce({ stdout: "Some checks passed", stderr: "Warning: outdated version" });
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].text).toContain("Warning: outdated version");
  });
});

// ── CLI ツール共通 ──

describe("CLI tools common patterns", () => {
  // 29
  it("all CLI tools use text content type", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockNotInstalled();
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].type).toBe("text");
  });

  // 30
  it("cli_send_file handles unexpected error", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockExecFile.mockRejectedValueOnce(new Error("Unexpected"));
    const r = await s.callTool("cli_send_file", { filePath: "/file" }) as any;
    expect(r.isError).toBe(true);
  });

  // 31
  it("cli_receive_file handles unexpected error", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockExecFile.mockRejectedValueOnce(new Error("Unexpected"));
    const r = await s.callTool("cli_receive_file", { code: "abc" }) as any;
    // receiveFile returns CliResult with error info (doesn't throw)
    // but if the error propagates, it should be caught
    expect(r.content[0]).toBeDefined();
  });

  // 32
  it("cli_ssh_add_key handles exception", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockExecFile.mockRejectedValueOnce(new Error("Connection lost"));
    const r = await s.callTool("cli_ssh_add_key", { publicKey: "key" }) as any;
    expect(r.content[0]).toBeDefined();
  });

  // 33
  it("cli_ssh_connect handles exception", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockExecFile.mockRejectedValueOnce(new Error("Timeout"));
    const r = await s.callTool("cli_ssh_connect", { podId: "p1" }) as any;
    expect(r.content[0]).toBeDefined();
  });

  // 34
  it("cli_doctor handles version check failure", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockFailure("version check failed");
    const r = await s.callTool("cli_doctor") as any;
    expect(r.isError).toBe(true);
  });

  // 35
  it("cli_send_file with large file path", async () => {
    const s = createMockServer();
    registerCliSendFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    const longPath = "/home/user/" + "a".repeat(200) + "/data.tar.gz";
    mockSuccess("Code is: long-path-code");
    const r = await s.callTool("cli_send_file", { filePath: longPath }) as any;
    expect(r.content[0].text).toContain("long-path-code");
  });

  // 36
  it("cli_receive_file with complex code", async () => {
    const s = createMockServer();
    registerCliReceiveFile(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("File received: checkpoint.pt");
    const r = await s.callTool("cli_receive_file", { code: "complex-code-with-many-parts-123" }) as any;
    expect(r.content[0].text).toContain("受信しました");
  });

  // 37
  it("cli_ssh_add_key with ed25519 key", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Key added: ed25519");
    const r = await s.callTool("cli_ssh_add_key", {
      publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGVfM... user@machine",
    }) as any;
    expect(r.content[0].text).toContain("追加しました");
  });

  // 38
  it("cli_ssh_add_key with rsa key", async () => {
    const s = createMockServer();
    registerCliSshAddKey(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("Key added: rsa");
    const r = await s.callTool("cli_ssh_add_key", {
      publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAA... user@machine",
    }) as any;
    expect(r.content[0].text).toContain("追加しました");
  });

  // 39
  it("cli_ssh_connect shows full connection string", async () => {
    const s = createMockServer();
    registerCliSshConnect(s as any);
    mockSuccess("runpodctl v1.0.0");
    mockSuccess("ssh -o StrictHostKeyChecking=no root@pod.runpod.io -p 22345");
    const r = await s.callTool("cli_ssh_connect", { podId: "abc" }) as any;
    expect(r.content[0].text).toContain("22345");
  });

  // 40
  it("cli_doctor shows full diagnostic output", async () => {
    const s = createMockServer();
    registerCliDoctor(s as any);
    mockSuccess("runpodctl v1.5.0");
    mockSuccess("runpodctl v1.5.0");
    mockSuccess("API Key: ✓\nConnectivity: ✓\nVersion: v1.5.0 (latest)");
    const r = await s.callTool("cli_doctor") as any;
    expect(r.content[0].text).toContain("API Key: ✓");
    expect(r.content[0].text).toContain("Connectivity: ✓");
  });
});
