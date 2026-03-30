import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RunPod MCP Server — Claude から GPU を操作",
  description:
    "RunPod GPU FaaS を Claude から操作するための MCP サーバー。Pod管理、サーバーレスEndpoint、ジョブ実行、ファイル転送、SSH接続をAIアシスタントから直接操作。",
  openGraph: {
    title: "RunPod MCP Server",
    description: "Claude から RunPod GPU インフラを操作する MCP サーバー",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #0a0a0f;
            --surface: #13131a;
            --border: #23233a;
            --text: #e4e4ef;
            --text-muted: #8888a4;
            --accent: #673ab7;
            --accent-light: #9c6eff;
            --green: #22c55e;
            --blue: #3b82f6;
            --orange: #f59e0b;
            --radius: 12px;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }
          a { color: var(--accent-light); text-decoration: none; }
          a:hover { text-decoration: underline; }
          code {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 0.875em;
            font-family: 'SF Mono', 'Fira Code', monospace;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
