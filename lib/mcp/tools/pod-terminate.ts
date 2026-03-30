/**
 * pod_terminate ツール
 * Podを完全に削除する（データも全て削除される）
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { terminatePod } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerPodTerminate(server: McpServer) {
  server.registerTool(
    "pod_terminate",
    {
      title: "Pod削除",
      description:
        "Podを完全に削除する。ネットワークボリュームに保存されていないデータは全て失われる。" +
        "この操作は取り消せません。",
      inputSchema: {
        podId: z.string().describe("削除するPodのID"),
      },
    },
    async ({ podId }) => {
      try {
        await terminatePod(podId);
        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${podId} を完全に削除しました。`,
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
