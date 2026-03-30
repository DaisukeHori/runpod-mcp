/**
 * CLI Wrapper 単体テスト (40件)
 *
 * child_process.execFile をモックして各CLI関数を検証する
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// execFile をモック - vi.hoisted で変数をhoistする
const mockExecFile = vi.hoisted(() => vi.fn());

vi.mock("child_process", () => ({
  execFile: mockExecFile,
}));
vi.mock("util", () => ({
  promisify: () => mockExecFile,
}));

import {
  execRunpodctl,
  isCliInstalled,
  getCliVersion,
  sendFile,
  receiveFile,
  addSshKey,
  getSshConnection,
  cliListPods,
  cliGetPod,
  cliStopPod,
  cliStartPod,
  cliDeletePod,
  cliListEndpoints,
  cliGetEndpoint,
  cliDeleteEndpoint,
  runDoctor,
  configureApiKey,
} from "@/lib/runpod/cli";

beforeEach(() => {
  mockExecFile.mockReset();
});

function mockSuccess(stdout: string, stderr = "") {
  mockExecFile.mockResolvedValueOnce({ stdout, stderr });
}

function mockFailure(stderr: string, code = 1) {
  const error = new Error("Command failed") as any;
  error.stdout = "";
  error.stderr = stderr;
  error.code = code;
  error.killed = false;
  mockExecFile.mockRejectedValueOnce(error);
}

function mockTimeout() {
  const error = new Error("Timed out") as any;
  error.stdout = "";
  error.stderr = "";
  error.killed = true;
  mockExecFile.mockRejectedValueOnce(error);
}

describe("execRunpodctl", () => {
  // 1
  it("should call runpodctl with args", async () => {
    mockSuccess("output");
    await execRunpodctl(["pod", "list"]);
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "list"],
      expect.objectContaining({ timeout: 30000 })
    );
  });

  // 2
  it("should return stdout and exitCode 0 on success", async () => {
    mockSuccess("pod list output");
    const result = await execRunpodctl(["pod", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("pod list output");
  });

  // 3
  it("should return stderr on failure", async () => {
    mockFailure("not found");
    const result = await execRunpodctl(["pod", "get", "bad"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("not found");
  });

  // 4
  it("should handle timeout", async () => {
    mockTimeout();
    const result = await execRunpodctl(["send", "bigfile"]);
    expect(result.exitCode).toBe(124);
    expect(result.stderr).toContain("タイムアウト");
  });

  // 5
  it("should use custom timeout", async () => {
    mockSuccess("ok");
    await execRunpodctl(["doctor"], { timeout: 60000 });
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["doctor"],
      expect.objectContaining({ timeout: 60000 })
    );
  });

  // 6
  it("should trim stdout and stderr", async () => {
    mockSuccess("  output  \n", "  warning  \n");
    const result = await execRunpodctl(["test"]);
    expect(result.stdout).toBe("output");
    expect(result.stderr).toBe("warning");
  });
});

describe("isCliInstalled", () => {
  // 7
  it("should return true when runpodctl is available", async () => {
    mockSuccess("runpodctl v1.2.3");
    const result = await isCliInstalled();
    expect(result).toBe(true);
  });

  // 8
  it("should return false when runpodctl is not found", async () => {
    mockFailure("command not found");
    const result = await isCliInstalled();
    expect(result).toBe(false);
  });
});

describe("getCliVersion", () => {
  // 9
  it("should return version string", async () => {
    mockSuccess("runpodctl v1.2.3");
    const version = await getCliVersion();
    expect(version).toBe("runpodctl v1.2.3");
  });

  // 10
  it("should throw on failure", async () => {
    mockFailure("not installed");
    await expect(getCliVersion()).rejects.toThrow("version check failed");
  });
});

describe("sendFile", () => {
  // 11
  it("should call runpodctl send with file path", async () => {
    mockSuccess("Code is: abc-123-def");
    await sendFile("/path/to/file.tar.gz");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["send", "/path/to/file.tar.gz"],
      expect.objectContaining({ timeout: 300000 })
    );
  });

  // 12
  it("should extract code from output", async () => {
    mockSuccess("Sending...\nCode is: abc-123-def\nDone.");
    const result = await sendFile("/file.txt");
    expect(result.code).toBe("abc-123-def");
  });

  // 13
  it("should throw on failure", async () => {
    mockFailure("file not found");
    await expect(sendFile("/nonexistent")).rejects.toThrow("ファイル送信に失敗");
  });

  // 14
  it("should return rawOutput", async () => {
    mockSuccess("Code is: xxx\nSending file.txt");
    const result = await sendFile("/file.txt");
    expect(result.rawOutput).toContain("Sending");
  });

  // 15
  it("should handle missing code in output", async () => {
    mockSuccess("Sending file...");
    const result = await sendFile("/file.txt");
    expect(result.code).toBe("");
  });
});

describe("receiveFile", () => {
  // 16
  it("should call runpodctl receive with code", async () => {
    mockSuccess("Received file.txt");
    await receiveFile("abc-123");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["receive", "abc-123"],
      expect.objectContaining({ timeout: 300000 })
    );
  });

  // 17
  it("should return CliResult on success", async () => {
    mockSuccess("Received file.txt (1.2MB)");
    const result = await receiveFile("abc-123");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Received");
  });

  // 18
  it("should return error on failure", async () => {
    mockFailure("invalid code");
    const result = await receiveFile("bad-code");
    expect(result.exitCode).toBe(1);
  });
});

describe("addSshKey", () => {
  // 19
  it("should call runpodctl ssh add-key", async () => {
    mockSuccess("Key added");
    await addSshKey("ssh-ed25519 AAAA...");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["ssh", "add-key", "ssh-ed25519 AAAA..."],
      expect.any(Object)
    );
  });

  // 20
  it("should return success result", async () => {
    mockSuccess("SSH key added successfully");
    const result = await addSshKey("ssh-rsa ...");
    expect(result.exitCode).toBe(0);
  });
});

describe("getSshConnection", () => {
  // 21
  it("should call runpodctl ssh connect", async () => {
    mockSuccess("ssh root@pod-ip -p 22");
    await getSshConnection("pod-123");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["ssh", "connect", "pod-123"],
      expect.any(Object)
    );
  });

  // 22
  it("should return connection info", async () => {
    mockSuccess("ssh root@1.2.3.4 -p 22000");
    const result = await getSshConnection("pod-123");
    expect(result.stdout).toContain("ssh root@");
  });
});

describe("cliListPods", () => {
  // 23
  it("should call pod list", async () => {
    mockSuccess("[]");
    await cliListPods();
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "list"],
      expect.any(Object)
    );
  });

  // 24
  it("should pass format flag", async () => {
    mockSuccess("{}");
    await cliListPods({ format: "json" });
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "list", "--format", "json"],
      expect.any(Object)
    );
  });

  // 25
  it("should pass table format", async () => {
    mockSuccess("ID  NAME  STATUS");
    await cliListPods({ format: "table" });
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "list", "--format", "table"],
      expect.any(Object)
    );
  });
});

describe("cliGetPod", () => {
  // 26
  it("should call pod get with id", async () => {
    mockSuccess('{"id": "pod-1"}');
    await cliGetPod("pod-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "get", "pod-1"],
      expect.any(Object)
    );
  });
});

describe("cliStopPod", () => {
  // 27
  it("should call pod stop with id", async () => {
    mockSuccess("Pod stopped");
    await cliStopPod("pod-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "stop", "pod-1"],
      expect.any(Object)
    );
  });
});

describe("cliStartPod", () => {
  // 28
  it("should call pod start with id", async () => {
    mockSuccess("Pod started");
    await cliStartPod("pod-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "start", "pod-1"],
      expect.any(Object)
    );
  });
});

describe("cliDeletePod", () => {
  // 29
  it("should call pod delete with id", async () => {
    mockSuccess("Pod deleted");
    await cliDeletePod("pod-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "delete", "pod-1"],
      expect.any(Object)
    );
  });
});

describe("cliListEndpoints", () => {
  // 30
  it("should call serverless list", async () => {
    mockSuccess("[]");
    await cliListEndpoints();
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["serverless", "list"],
      expect.any(Object)
    );
  });
});

describe("cliGetEndpoint", () => {
  // 31
  it("should call serverless get with id", async () => {
    mockSuccess('{"id": "ep-1"}');
    await cliGetEndpoint("ep-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["serverless", "get", "ep-1"],
      expect.any(Object)
    );
  });
});

describe("cliDeleteEndpoint", () => {
  // 32
  it("should call serverless delete with id", async () => {
    mockSuccess("Deleted");
    await cliDeleteEndpoint("ep-1");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["serverless", "delete", "ep-1"],
      expect.any(Object)
    );
  });
});

describe("runDoctor", () => {
  // 33
  it("should call doctor command", async () => {
    mockSuccess("All checks passed");
    await runDoctor();
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["doctor"],
      expect.objectContaining({ timeout: 60000 })
    );
  });

  // 34
  it("should return diagnostic output", async () => {
    mockSuccess("CLI: OK\nAPI: OK\nNetwork: OK");
    const result = await runDoctor();
    expect(result.stdout).toContain("CLI: OK");
  });
});

describe("configureApiKey", () => {
  // 35
  it("should call config with apiKey", async () => {
    mockSuccess("API key configured");
    await configureApiKey("my-api-key");
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["config", "--apiKey=my-api-key"],
      expect.any(Object)
    );
  });

  // 36
  it("should return success result", async () => {
    mockSuccess("Configured successfully");
    const result = await configureApiKey("key-123");
    expect(result.exitCode).toBe(0);
  });
});

describe("edge cases", () => {
  // 37
  it("should handle empty stdout", async () => {
    mockSuccess("");
    const result = await execRunpodctl(["test"]);
    expect(result.stdout).toBe("");
  });

  // 38
  it("should handle non-numeric exit code", async () => {
    const error = new Error("ENOENT") as any;
    error.stdout = "";
    error.stderr = "runpodctl not found";
    error.code = "ENOENT";
    error.killed = false;
    mockExecFile.mockRejectedValueOnce(error);
    const result = await execRunpodctl(["test"]);
    expect(result.exitCode).toBe(1);
  });

  // 39
  it("should pass custom env vars", async () => {
    mockSuccess("ok");
    await execRunpodctl(["test"], { env: { CUSTOM_VAR: "value" } });
    const callEnv = mockExecFile.mock.calls[0][2].env;
    expect(callEnv.CUSTOM_VAR).toBe("value");
  });

  // 40
  it("cliListPods without format should not include --format flag", async () => {
    mockSuccess("output");
    await cliListPods();
    expect(mockExecFile).toHaveBeenCalledWith(
      "runpodctl",
      ["pod", "list"],
      expect.any(Object)
    );
  });
});
