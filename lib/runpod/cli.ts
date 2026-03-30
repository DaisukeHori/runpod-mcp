/**
 * runpodctl CLI Wrapper
 *
 * RunPod CLI (runpodctl) が提供するAPI非対応の機能をラップする:
 * - P2Pファイル転送 (send/receive)
 * - SSH鍵管理・接続
 * - Pod/Endpoint CLIコマンド
 * - 診断 (doctor)
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 30_000;

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CliOptions {
  timeout?: number;
  env?: Record<string, string>;
}

/**
 * runpodctl コマンドを実行する
 */
export async function execRunpodctl(
  args: string[],
  options: CliOptions = {}
): Promise<CliResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  try {
    const { stdout, stderr } = await execFileAsync("runpodctl", args, {
      timeout,
      env: { ...process.env, ...options.env },
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean };
    if (err.killed) {
      return {
        stdout: err.stdout?.trim() ?? "",
        stderr: "コマンドがタイムアウトしました",
        exitCode: 124,
      };
    }
    return {
      stdout: err.stdout?.trim() ?? "",
      stderr: err.stderr?.trim() ?? String(error),
      exitCode: typeof err.code === "number" ? err.code : 1,
    };
  }
}

/**
 * runpodctl がインストールされているか確認する
 */
export async function isCliInstalled(): Promise<boolean> {
  try {
    const result = await execRunpodctl(["--version"], { timeout: 5000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * runpodctl のバージョンを取得する
 */
export async function getCliVersion(): Promise<string> {
  const result = await execRunpodctl(["--version"]);
  if (result.exitCode !== 0) {
    throw new Error(`runpodctl version check failed: ${result.stderr}`);
  }
  return result.stdout;
}

// ── ファイル転送 ──

export interface SendFileResult {
  code: string;
  rawOutput: string;
}

/**
 * ファイルをP2P転送用に送信し、ワンタイムコードを返す
 */
export async function sendFile(
  filePath: string,
  options: CliOptions = {}
): Promise<SendFileResult> {
  const result = await execRunpodctl(["send", filePath], {
    timeout: options.timeout ?? 300_000, // ファイル転送は5分
    ...options,
  });

  if (result.exitCode !== 0) {
    throw new Error(`ファイル送信に失敗: ${result.stderr}`);
  }

  // コード抽出: "Code is: xxxx-xxxx-xxxx" パターン
  const codeMatch = result.stdout.match(/Code is:\s*(\S+)/i)
    || result.stderr.match(/Code is:\s*(\S+)/i);
  const code = codeMatch ? codeMatch[1] : "";

  return { code, rawOutput: result.stdout || result.stderr };
}

/**
 * ワンタイムコードを使ってファイルを受信する
 */
export async function receiveFile(
  code: string,
  options: CliOptions = {}
): Promise<CliResult> {
  return execRunpodctl(["receive", code], {
    timeout: options.timeout ?? 300_000,
    ...options,
  });
}

// ── SSH 管理 ──

/**
 * SSH公開鍵をRunPodアカウントに追加する
 */
export async function addSshKey(publicKey: string): Promise<CliResult> {
  return execRunpodctl(["ssh", "add-key", publicKey]);
}

/**
 * PodへのSSH接続情報を取得する
 */
export async function getSshConnection(podId: string): Promise<CliResult> {
  return execRunpodctl(["ssh", "connect", podId]);
}

// ── Pod CLI 操作 ──

export interface CliPodListOptions {
  format?: "json" | "table" | "yaml";
}

/**
 * CLI経由でPod一覧を取得する
 */
export async function cliListPods(
  options: CliPodListOptions = {}
): Promise<CliResult> {
  const args = ["pod", "list"];
  if (options.format) args.push("--format", options.format);
  return execRunpodctl(args);
}

/**
 * CLI経由でPodの詳細を取得する
 */
export async function cliGetPod(podId: string): Promise<CliResult> {
  return execRunpodctl(["pod", "get", podId]);
}

/**
 * CLI経由でPodを停止する
 */
export async function cliStopPod(podId: string): Promise<CliResult> {
  return execRunpodctl(["pod", "stop", podId]);
}

/**
 * CLI経由でPodを起動する
 */
export async function cliStartPod(podId: string): Promise<CliResult> {
  return execRunpodctl(["pod", "start", podId]);
}

/**
 * CLI経由でPodを削除する
 */
export async function cliDeletePod(podId: string): Promise<CliResult> {
  return execRunpodctl(["pod", "delete", podId]);
}

// ── Serverless CLI 操作 ──

/**
 * CLI経由でサーバーレスEndpoint一覧を取得する
 */
export async function cliListEndpoints(): Promise<CliResult> {
  return execRunpodctl(["serverless", "list"]);
}

/**
 * CLI経由でサーバーレスEndpointの詳細を取得する
 */
export async function cliGetEndpoint(endpointId: string): Promise<CliResult> {
  return execRunpodctl(["serverless", "get", endpointId]);
}

/**
 * CLI経由でサーバーレスEndpointを削除する
 */
export async function cliDeleteEndpoint(endpointId: string): Promise<CliResult> {
  return execRunpodctl(["serverless", "delete", endpointId]);
}

// ── 診断 ──

/**
 * runpodctl doctor で診断を実行する
 */
export async function runDoctor(): Promise<CliResult> {
  return execRunpodctl(["doctor"], { timeout: 60_000 });
}

/**
 * runpodctl にAPIキーを設定する
 */
export async function configureApiKey(apiKey: string): Promise<CliResult> {
  return execRunpodctl(["config", `--apiKey=${apiKey}`]);
}
