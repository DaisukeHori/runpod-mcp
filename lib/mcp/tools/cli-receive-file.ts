/**
 * cli_receive_file ツール
 * runpodctl を使用してP2Pファイル転送（受信）を行う
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { receiveFile, isCliInstalled } from "@/lib/runpod/cli";

export function registerCliReceiveFile(server: McpServer) {
  server.registerTool(
    "cli_receive_file",
    {
      title: "ファイル受信 (P2P)",
      description:
        "runpodctl を使用してP2Pファイルを受信する。" +
        "cli_send_file で取得したワンタイムコードを使用する。",
      inputSchema: {
        code: z.string().describe("送信側から受け取ったワンタイムコード"),
      },
    },
    async ({ code }) => {
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

        const result = await receiveFile(code);

        if (result.exitCode !== 0) {
          return {
            content: [
              { type: "text" as const, text: `ファイル受信エラー: ${result.stderr}` },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `ファイルを受信しました。\n\n${result.stdout}`,
            },
          ],
        };
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
