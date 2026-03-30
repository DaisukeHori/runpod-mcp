/**
 * cli_doctor ツール
 * runpodctl の診断機能を実行する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runDoctor, getCliVersion, isCliInstalled } from "@/lib/runpod/cli";

export function registerCliDoctor(server: McpServer) {
  server.registerTool(
    "cli_doctor",
    {
      title: "CLI診断",
      description:
        "runpodctl の診断を実行する。CLIの状態、設定、接続性を確認する。",
      inputSchema: {},
    },
    async () => {
      try {
        const installed = await isCliInstalled();
        if (!installed) {
          return {
            content: [
              {
                type: "text" as const,
                text: "エラー: runpodctl がインストールされていません。\nインストール: wget -qO- cli.runpod.net | sudo bash",
              },
            ],
            isError: true,
          };
        }

        const version = await getCliVersion();
        const doctorResult = await runDoctor();

        const text =
          `runpodctl 診断結果\n\n` +
          `バージョン: ${version}\n\n` +
          `診断出力:\n${doctorResult.stdout}\n` +
          (doctorResult.stderr ? `\n警告:\n${doctorResult.stderr}` : "");

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
