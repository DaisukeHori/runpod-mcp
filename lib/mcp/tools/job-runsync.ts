/**
 * job_runsync ツール
 * サーバーレスEndpointに同期ジョブを送信し、結果を待つ
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runJobSync } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerJobRunSync(server: McpServer) {
  server.registerTool(
    "job_runsync",
    {
      title: "ジョブ送信（同期）",
      description:
        "サーバーレスEndpointに同期ジョブを送信し、完了まで待機する。" +
        "レスポンスにジョブの結果が直接含まれる。",
      inputSchema: {
        endpointId: z.string().describe("EndpointのID"),
        input: z.record(z.unknown()).describe("ジョブに渡す入力データ (JSON)"),
        executionTimeout: z.number().optional().describe("実行タイムアウト秒"),
      },
    },
    async ({ endpointId, input, executionTimeout }) => {
      try {
        const payload: { input: Record<string, unknown>; policy?: { executionTimeout: number } } = { input };
        if (executionTimeout) payload.policy = { executionTimeout };

        const result = await runJobSync(endpointId, payload);

        const text =
          `ジョブ完了\n\n` +
          `ジョブID: ${result.id}\n` +
          `ステータス: ${result.status}\n` +
          (result.executionTime ? `実行時間: ${result.executionTime}ms\n` : "") +
          (result.delayTime ? `待機時間: ${result.delayTime}ms\n` : "") +
          (result.error ? `エラー: ${result.error}\n` : "") +
          `\n出力:\n\`\`\`json\n${JSON.stringify(result.output, null, 2)}\n\`\`\``;

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
