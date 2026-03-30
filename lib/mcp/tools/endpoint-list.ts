/**
 * endpoint_list ツール
 * サーバーレスEndpoint一覧を取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listEndpoints } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerEndpointList(server: McpServer) {
  server.registerTool(
    "endpoint_list",
    {
      title: "Endpoint一覧取得",
      description: "RunPodアカウント内のサーバーレスEndpoint一覧を取得する。",
      inputSchema: {},
    },
    async () => {
      try {
        const endpoints = await listEndpoints();

        if (endpoints.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "サーバーレスEndpointが見つかりませんでした。",
              },
            ],
          };
        }

        const lines = endpoints.map((ep, index) =>
          `${index + 1}. **${ep.name}**\n` +
          `   ID: ${ep.id}\n` +
          `   GPU: ${ep.gpuIds}\n` +
          `   ワーカー: ${ep.workersMin}〜${ep.workersMax} | アイドルタイムアウト: ${ep.idleTimeout}秒`
        );

        const text = `サーバーレスEndpoint一覧 (${endpoints.length}件):\n\n${lines.join("\n\n")}`;

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        const message =
          error instanceof RunPodError
            ? error.toUserMessage()
            : `予期しないエラー: ${error instanceof Error ? error.message : String(error)}`;
        return {
          content: [{ type: "text" as const, text: `エラー: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
