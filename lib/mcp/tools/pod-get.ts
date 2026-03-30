/**
 * pod_get ツール
 * 指定したPodの詳細情報を取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPod } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerPodGet(server: McpServer) {
  server.registerTool(
    "pod_get",
    {
      title: "Pod詳細取得",
      description: "指定したPod IDの詳細情報を取得する。GPU使用率やランタイム情報を含む。",
      inputSchema: {
        podId: z.string().describe("取得するPodのID"),
      },
    },
    async ({ podId }) => {
      try {
        const pod = await getPod(podId);

        const gpuInfo = pod.runtime?.gpus
          ?.map(
            (g) =>
              `  - GPU ${g.id}: 使用率 ${g.gpuUtilPercent ?? "N/A"}% | メモリ使用率 ${g.memoryUtilPercent ?? "N/A"}%`
          )
          .join("\n") || "  (ランタイム情報なし)";

        const text =
          `**${pod.name}** (${pod.id})\n\n` +
          `ステータス: ${pod.desiredStatus}\n` +
          `GPU: ${pod.gpuDisplayName || pod.gpuTypeId} x${pod.gpuCount}\n` +
          `イメージ: ${pod.imageName}\n` +
          `コスト: $${pod.costPerHr}/hr\n` +
          `ディスク: ${pod.containerDiskInGb}GB | ボリューム: ${pod.volumeInGb}GB\n` +
          `ポート: ${pod.ports || "なし"}\n` +
          `稼働時間: ${pod.uptimeSeconds ? Math.round(pod.uptimeSeconds / 60) + "分" : "N/A"}\n\n` +
          `GPU ランタイム:\n${gpuInfo}`;

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
