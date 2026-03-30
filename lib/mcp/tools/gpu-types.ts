/**
 * gpu_types ツール
 * 利用可能なGPU種別と価格を一覧表示する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGpuTypes } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerGpuTypes(server: McpServer) {
  server.registerTool(
    "gpu_types",
    {
      title: "GPU種別一覧",
      description:
        "RunPodで利用可能なGPU種別、VRAM、価格、クラウド種別を一覧表示する。" +
        "Pod作成時のgpuTypeId選択に使用する。",
      inputSchema: {},
    },
    async () => {
      try {
        const gpuTypes = await getGpuTypes();

        if (gpuTypes.length === 0) {
          return {
            content: [
              { type: "text" as const, text: "GPU種別情報を取得できませんでした。" },
            ],
          };
        }

        const sorted = [...gpuTypes].sort((a, b) => a.memoryInGb - b.memoryInGb);

        const lines = sorted.map((gpu) => {
          const cloud = [
            gpu.secureCloud ? "Secure" : null,
            gpu.communityCloud ? "Community" : null,
          ]
            .filter(Boolean)
            .join(", ");

          const onDemand = gpu.lowestPrice.uninterruptablePrice
            ? `$${gpu.lowestPrice.uninterruptablePrice}/hr`
            : "N/A";
          const spot = gpu.lowestPrice.minimumBidPrice
            ? `$${gpu.lowestPrice.minimumBidPrice}/hr`
            : "N/A";

          return (
            `- **${gpu.displayName}** (${gpu.id})\n` +
            `  VRAM: ${gpu.memoryInGb}GB | オンデマンド: ${onDemand} | スポット: ${spot} | ${cloud}`
          );
        });

        const text = `利用可能なGPU種別 (${gpuTypes.length}種):\n\n${lines.join("\n")}`;

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
