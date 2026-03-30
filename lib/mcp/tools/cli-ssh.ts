/**
 * cli_ssh_key / cli_ssh_connect ツール
 * runpodctl を使用してSSH鍵管理と接続情報取得を行う
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addSshKey, getSshConnection, isCliInstalled } from "@/lib/runpod/cli";

export function registerCliSshAddKey(server: McpServer) {
  server.registerTool(
    "cli_ssh_add_key",
    {
      title: "SSH鍵追加",
      description: "SSH公開鍵をRunPodアカウントに追加する。Pod作成時にSSHアクセスが可能になる。",
      inputSchema: {
        publicKey: z.string().describe("SSH公開鍵 (例: ssh-ed25519 AAAA... user@host)"),
      },
    },
    async ({ publicKey }) => {
      try {
        const installed = await isCliInstalled();
        if (!installed) {
          return {
            content: [
              {
                type: "text" as const,
                text: "エラー: runpodctl がインストールされていません。",
              },
            ],
            isError: true,
          };
        }

        const result = await addSshKey(publicKey);

        if (result.exitCode !== 0) {
          return {
            content: [
              { type: "text" as const, text: `SSH鍵追加エラー: ${result.stderr}` },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `SSH鍵を追加しました。\n\n${result.stdout}`,
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

export function registerCliSshConnect(server: McpServer) {
  server.registerTool(
    "cli_ssh_connect",
    {
      title: "SSH接続情報取得",
      description: "指定したPodへのSSH接続情報を取得する。",
      inputSchema: {
        podId: z.string().describe("接続するPodのID"),
      },
    },
    async ({ podId }) => {
      try {
        const installed = await isCliInstalled();
        if (!installed) {
          return {
            content: [
              {
                type: "text" as const,
                text: "エラー: runpodctl がインストールされていません。",
              },
            ],
            isError: true,
          };
        }

        const result = await getSshConnection(podId);

        if (result.exitCode !== 0) {
          return {
            content: [
              { type: "text" as const, text: `SSH接続情報取得エラー: ${result.stderr}` },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `SSH接続情報:\n\n${result.stdout}`,
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
