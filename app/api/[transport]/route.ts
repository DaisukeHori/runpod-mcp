/**
 * MCP エンドポイント
 *
 * /api/mcp  → Streamable HTTP (メイン)
 * /api/sse  → SSE (後方互換、mcp-handler が自動処理)
 *
 * mcp-handler の [transport] ダイナミックルートにより
 * 両方のトランスポートが自動的に処理される。
 */

import { createMcpHandler } from "mcp-handler";
import { registerAllTools } from "@/lib/mcp/server";

const handler = createMcpHandler(
  (server) => {
    registerAllTools(server);
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  }
);

export { handler as GET, handler as POST };
