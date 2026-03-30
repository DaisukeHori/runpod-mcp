/**
 * job_run ツール
 * サーバーレスEndpointに非同期ジョブを送信する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runJob } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerJobRun(server: McpServer) {
  server.registerTool(
    "job_run",
    {
      title: "ジョブ送信（非同期）",
      description:
        "サーバーレスEndpointに非同期ジョブを送信する。" +
        "ジョブIDが返されるので、job_status で結果を確認する。",
      inputSchema: {
        endpointId: z.string().describe("EndpointのID"),
        input: z.record(z.unknown()).describe("ジョブに渡す入力データ (JSON)"),
        webhook: z.string().optional().describe("完了時にPOSTされるWebhook URL"),
        executionTimeout: z.number().optional().describe("実行タイムアウト秒"),
      },
    },
    async ({ endpointId, input, webhook, executionTimeout }) => {
      try {
        const payload: { input: Record<string, unknown>; webhook?: string; policy?: { executionTimeout: number } } = { input };
        if (webhook) payload.webhook = webhook;
        if (executionTimeout) payload.policy = { executionTimeout };

        const result = await runJob(endpointId, payload);

        const text =
          `ジョブを送信しました。\n\n` +
          `ジョブID: ${result.id}\n` +
          `ステータス: ${result.status}\n\n` +
          `結果を確認するには job_status ツールを使用してください。`;

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
