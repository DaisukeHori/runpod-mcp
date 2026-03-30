/**
 * endpoint_create ツール
 * 新しいサーバーレスEndpointを作成する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createEndpoint } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerEndpointCreate(server: McpServer) {
  server.registerTool(
    "endpoint_create",
    {
      title: "Endpoint作成",
      description:
        "新しいサーバーレスEndpointを作成する。テンプレートID、GPU種別、ワーカー数を指定する。",
      inputSchema: {
        name: z.string().describe("Endpoint名"),
        templateId: z.string().describe("使用するテンプレートのID"),
        gpuIds: z.string().describe("GPU種別ID (例: 'NVIDIA RTX A6000')"),
        workersMin: z.number().optional().default(0).describe("最小ワーカー数 (デフォルト: 0)"),
        workersMax: z.number().optional().default(3).describe("最大ワーカー数 (デフォルト: 3)"),
        idleTimeout: z.number().optional().default(5).describe("アイドルタイムアウト秒 (デフォルト: 5)"),
      },
    },
    async ({ name, templateId, gpuIds, workersMin, workersMax, idleTimeout }) => {
      try {
        const ep = await createEndpoint({
          name,
          templateId,
          gpuIds,
          workersMin,
          workersMax,
          idleTimeout,
        });

        const text =
          `Endpointを作成しました！\n\n` +
          `**${ep.name}** (${ep.id})\n` +
          `GPU: ${ep.gpuIds}\n` +
          `ワーカー: ${ep.workersMin}〜${ep.workersMax}`;

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
