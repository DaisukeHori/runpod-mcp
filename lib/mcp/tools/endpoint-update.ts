/**
 * endpoint_update ツール
 * 既存のサーバーレスEndpointを更新する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { updateEndpoint } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerEndpointUpdate(server: McpServer) {
  server.registerTool(
    "endpoint_update",
    {
      title: "Endpoint更新",
      description: "既存のサーバーレスEndpointの設定を更新する。",
      inputSchema: {
        endpointId: z.string().describe("更新するEndpointのID"),
        name: z.string().optional().describe("新しいEndpoint名"),
        gpuIds: z.string().optional().describe("新しいGPU種別ID"),
        workersMin: z.number().optional().describe("新しい最小ワーカー数"),
        workersMax: z.number().optional().describe("新しい最大ワーカー数"),
        idleTimeout: z.number().optional().describe("新しいアイドルタイムアウト秒"),
      },
    },
    async ({ endpointId, name, gpuIds, workersMin, workersMax, idleTimeout }) => {
      try {
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (gpuIds !== undefined) updates.gpuIds = gpuIds;
        if (workersMin !== undefined) updates.workersMin = workersMin;
        if (workersMax !== undefined) updates.workersMax = workersMax;
        if (idleTimeout !== undefined) updates.idleTimeout = idleTimeout;

        const ep = await updateEndpoint(endpointId, updates);

        const text =
          `Endpointを更新しました。\n\n` +
          `**${ep.name}** (${ep.id})\n` +
          `GPU: ${ep.gpuIds}\n` +
          `ワーカー: ${ep.workersMin}〜${ep.workersMax}\n` +
          `アイドルタイムアウト: ${ep.idleTimeout}秒`;

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
