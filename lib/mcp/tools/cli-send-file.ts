/**
 * cli_send_file ツール
 * runpodctl を使用してP2Pファイル転送（送信）を行う
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendFile, isCliInstalled } from "@/lib/runpod/cli";

export function registerCliSendFile(server: McpServer) {
  server.registerTool(
    "cli_send_file",
    {
      title: "ファイル送信 (P2P)",
      description:
        "runpodctl を使用してファイルをP2P転送する。" +
        "ワンタイムコードが返されるので、受信側で cli_receive_file を使用する。" +
        "APIキー不要、ポート開放不要。",
      inputSchema: {
        filePath: z.string().describe("送信するファイルのパス"),
      },
    },
    async ({ filePath }) => {
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

        const result = await sendFile(filePath);

        const text =
          `ファイル送信準備完了\n\n` +
          `ファイル: ${filePath}\n` +
          `受信コード: ${result.code}\n\n` +
          `受信側で以下を実行:\n` +
          `runpodctl receive ${result.code}`;

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
