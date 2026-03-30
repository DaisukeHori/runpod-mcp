/**
 * job_status ツール
 * サーバーレスジョブのステータスと結果を取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getJobStatus } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

const STATUS_LABELS: Record<string, string> = {
  IN_QUEUE: "⏳ キュー待ち",
  IN_PROGRESS: "🔄 実行中",
  COMPLETED: "✅ 完了",
  FAILED: "❌ 失敗",
  CANCELLED: "🚫 キャンセル",
  TIMED_OUT: "⏰ タイムアウト",
};

export function registerJobStatus(server: McpServer) {
  server.registerTool(
    "job_status",
    {
      title: "ジョブステータス確認",
      description: "サーバーレスジョブの現在のステータスと結果を取得する。",
      inputSchema: {
        endpointId: z.string().describe("EndpointのID"),
        jobId: z.string().describe("ジョブID"),
      },
    },
    async ({ endpointId, jobId }) => {
      try {
        const result = await getJobStatus(endpointId, jobId);

        const statusLabel = STATUS_LABELS[result.status] || result.status;

        let text =
          `ジョブ ${result.id}\n\n` +
          `ステータス: ${statusLabel}\n`;

        if (result.executionTime) text += `実行時間: ${result.executionTime}ms\n`;
        if (result.delayTime) text += `待機時間: ${result.delayTime}ms\n`;
        if (result.error) text += `エラー: ${result.error}\n`;

        if (result.output !== undefined) {
          text += `\n出力:\n\`\`\`json\n${JSON.stringify(result.output, null, 2)}\n\`\`\``;
        }

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
