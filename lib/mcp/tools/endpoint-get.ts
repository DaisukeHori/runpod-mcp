/**
 * endpoint_get ツール
 * 指定したサーバーレスEndpointの詳細を取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getEndpoint } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerEndpointGet(server: McpServer) {
  server.registerTool(
    "endpoint_get",
    {
      title: "Endpoint詳細取得",
      description: "指定したサーバーレスEndpointの詳細情報を取得する。",
      inputSchema: {
        endpointId: z.string().describe("EndpointのID"),
      },
    },
    async ({ endpointId }) => {
      try {
        const ep = await getEndpoint(endpointId);

        const text =
          `**${ep.name}** (${ep.id})\n\n` +
          `GPU: ${ep.gpuIds}\n` +
          `テンプレートID: ${ep.templateId || "N/A"}\n` +
          `ワーカー数: ${ep.workersMin}〜${ep.workersMax}\n` +
          `アイドルタイムアウト: ${ep.idleTimeout}秒\n` +
          `ロケーション: ${ep.locations || "自動"}\n` +
          `ネットワークボリューム: ${ep.networkVolumeId || "なし"}`;

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
