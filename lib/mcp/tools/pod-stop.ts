/**
 * pod_stop ツール
 * 稼働中のPodを停止する（ボリュームデータは保持される）
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stopPod } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerPodStop(server: McpServer) {
  server.registerTool(
    "pod_stop",
    {
      title: "Pod停止",
      description:
        "稼働中のPodを停止する。GPUは解放されるが、ボリュームデータは保持される。" +
        "ボリュームストレージの課金は継続する。",
      inputSchema: {
        podId: z.string().describe("停止するPodのID"),
      },
    },
    async ({ podId }) => {
      try {
        await stopPod(podId);
        return {
          content: [
            {
              type: "text" as const,
              text: `Pod ${podId} を停止しました。GPUは解放されましたが、ボリュームデータは保持されています。`,
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
