/**
 * pod_list ツール
 * RunPodアカウント内の全Podを一覧取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listPods } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerPodList(server: McpServer) {
  server.registerTool(
    "pod_list",
    {
      title: "Pod一覧取得",
      description:
        "RunPodアカウント内の全Podを一覧取得する。" +
        "名前、ID、GPU、ステータス、コストを表示する。",
      inputSchema: {},
    },
    async () => {
      try {
        const pods = await listPods();

        if (pods.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Podが見つかりませんでした。RunPodアカウントにPodが存在するか確認してください。",
              },
            ],
          };
        }

        const lines = pods.map((pod, index) => {
          const status = pod.desiredStatus === "RUNNING" ? "🟢 稼働中" : "⏸ 停止";
          return (
            `${index + 1}. **${pod.name}**\n` +
            `   ID: ${pod.id} | ${status}\n` +
            `   GPU: ${pod.gpuDisplayName || pod.gpuTypeId} x${pod.gpuCount}\n` +
            `   イメージ: ${pod.imageName}\n` +
            `   コスト: $${pod.costPerHr}/hr | ディスク: ${pod.containerDiskInGb}GB | ボリューム: ${pod.volumeInGb}GB`
          );
        });

        const text = `Pod一覧 (${pods.length}件):\n\n${lines.join("\n\n")}`;

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
