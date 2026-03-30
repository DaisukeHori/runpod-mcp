/**
 * job_cancel ツール
 * 実行中またはキュー待ちのジョブをキャンセルする
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cancelJob } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerJobCancel(server: McpServer) {
  server.registerTool(
    "job_cancel",
    {
      title: "ジョブキャンセル",
      description: "実行中またはキュー待ちのサーバーレスジョブをキャンセルする。",
      inputSchema: {
        endpointId: z.string().describe("EndpointのID"),
        jobId: z.string().describe("キャンセルするジョブのID"),
      },
    },
    async ({ endpointId, jobId }) => {
      try {
        await cancelJob(endpointId, jobId);
        return {
          content: [
            {
              type: "text" as const,
              text: `ジョブ ${jobId} をキャンセルしました。`,
            },
          ],
        };
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
