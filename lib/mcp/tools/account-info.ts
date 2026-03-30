/**
 * account_info ツール
 * RunPodアカウントの残高・利用状況を取得する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAccountInfo } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerAccountInfo(server: McpServer) {
  server.registerTool(
    "account_info",
    {
      title: "アカウント情報",
      description:
        "RunPodアカウントの残高、現在の時間あたり支出、マシンクォータなどを表示する。",
      inputSchema: {},
    },
    async () => {
      try {
        const info = await getAccountInfo();

        const text =
          `RunPod アカウント情報\n\n` +
          `メール: ${info.email}\n` +
          `残高: $${info.clientBalance.toFixed(2)}\n` +
          `ホスト残高: $${info.hostBalance.toFixed(2)}\n` +
          `現在の支出: $${info.currentSpendPerHr.toFixed(4)}/hr\n` +
          `支出上限: $${info.spendLimit}\n` +
          `マシンクォータ: ${info.machineQuota}\n` +
          `残高不足: ${info.underBalance ? "⚠️ はい" : "いいえ"}\n` +
          `MFA: ${info.multiFactorEnabled ? "有効" : "無効"}\n` +
          `リファラル収益: $${info.referralEarned.toFixed(2)}\n` +
          `テンプレート収益: $${info.templateEarned.toFixed(2)}`;

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
