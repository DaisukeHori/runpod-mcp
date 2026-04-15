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

// Vercel Serverless 上で Node.js ランタイムを明示する
// (Edge ランタイムでは MCP SDK が依存する Node API が利用できないため)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// MCP Streamable HTTP は GET / POST / DELETE を利用する
// (DELETE はセッション終了で使われるため、Next.js のルートからも公開する)
export { handler as GET, handler as POST, handler as DELETE };
