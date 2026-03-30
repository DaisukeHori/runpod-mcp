const tools = [
  {
    category: "Pod 管理",
    color: "#22c55e",
    items: [
      { name: "pod_list", desc: "Pod一覧取得" },
      { name: "pod_get", desc: "Pod詳細取得" },
      { name: "pod_create", desc: "Pod作成 (課金発生)" },
      { name: "pod_stop", desc: "Pod停止" },
      { name: "pod_terminate", desc: "Pod完全削除" },
    ],
  },
  {
    category: "サーバーレス Endpoint",
    color: "#3b82f6",
    items: [
      { name: "endpoint_list", desc: "Endpoint一覧" },
      { name: "endpoint_get", desc: "Endpoint詳細" },
      { name: "endpoint_create", desc: "Endpoint作成" },
      { name: "endpoint_update", desc: "Endpoint更新" },
    ],
  },
  {
    category: "ジョブ実行",
    color: "#f59e0b",
    items: [
      { name: "job_run", desc: "非同期ジョブ送信" },
      { name: "job_runsync", desc: "同期ジョブ送信" },
      { name: "job_status", desc: "ステータス確認" },
      { name: "job_cancel", desc: "ジョブキャンセル" },
    ],
  },
  {
    category: "GPU・アカウント",
    color: "#9c6eff",
    items: [
      { name: "gpu_types", desc: "GPU種別・価格一覧" },
      { name: "account_info", desc: "残高・利用状況" },
    ],
  },
  {
    category: "CLI (runpodctl)",
    color: "#ec4899",
    items: [
      { name: "cli_send_file", desc: "P2Pファイル送信" },
      { name: "cli_receive_file", desc: "P2Pファイル受信" },
      { name: "cli_ssh_add_key", desc: "SSH鍵追加" },
      { name: "cli_ssh_connect", desc: "SSH接続情報" },
      { name: "cli_doctor", desc: "CLI診断" },
    ],
  },
];

const steps = [
  {
    num: "1",
    title: "Vercel にデプロイ",
    desc: "このリポジトリを Vercel にデプロイします。",
  },
  {
    num: "2",
    title: "環境変数を設定",
    desc: "RUNPOD_API_KEY を Vercel の環境変数に設定します。",
    code: "RUNPOD_API_KEY=your_runpod_api_key_here",
  },
  {
    num: "3",
    title: "Claude Desktop に接続",
    desc: "MCP サーバーの URL を Claude Desktop 設定に追加します。",
    code: `{
  "mcpServers": {
    "runpod": {
      "type": "url",
      "url": "https://your-app.vercel.app/api/mcp"
    }
  }
}`,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 2rem",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(103,58,183,0.15) 0%, transparent 60%)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginBottom: "2rem",
          }}
        >
          <span style={{ color: "var(--green)" }}>●</span> 20 MCP Tools
          Available
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "800px",
            marginBottom: "1.5rem",
          }}
        >
          Claude から{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--accent-light), var(--blue))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RunPod GPU
          </span>{" "}
          を操作
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "var(--text-muted)",
            maxWidth: "600px",
            marginBottom: "2.5rem",
          }}
        >
          Pod管理、サーバーレスEndpoint、ジョブ実行、P2Pファイル転送、SSH接続を
          AI アシスタントから直接操作できる MCP サーバー
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="#setup"
            style={{
              padding: "12px 28px",
              borderRadius: "999px",
              background: "var(--accent)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            セットアップ
          </a>
          <a
            href="#tools"
            style={{
              padding: "12px 28px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            ツール一覧
          </a>
        </div>
      </section>

      {/* Endpoints */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {[
          {
            label: "Streamable HTTP (推奨)",
            endpoint: "/api/mcp",
            badge: "推奨",
            badgeColor: "var(--green)",
          },
          {
            label: "SSE (後方互換)",
            endpoint: "/api/sse",
            badge: "Legacy",
            badgeColor: "var(--orange)",
          },
        ].map((ep) => (
          <div
            key={ep.endpoint}
            style={{
              padding: "1.5rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: 600 }}>{ep.label}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: `${ep.badgeColor}22`,
                  color: ep.badgeColor,
                  fontWeight: 600,
                }}
              >
                {ep.badge}
              </span>
            </div>
            <code style={{ fontSize: "0.95rem" }}>{ep.endpoint}</code>
          </div>
        ))}
      </section>

      {/* Tools */}
      <section
        id="tools"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "4rem 2rem",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          利用可能なツール
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "2rem",
          }}
        >
          20個のMCPツールで RunPod インフラを完全操作
        </p>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
          }}
        >
          {tools.map((group) => (
            <div
              key={group.category}
              style={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: group.color,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {group.category}
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginLeft: "auto",
                  }}
                >
                  {group.items.length} tools
                </span>
              </div>
              <div style={{ padding: "0.75rem 1.5rem" }}>
                {group.items.map((tool) => (
                  <div
                    key={tool.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "0.6rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <code
                      style={{
                        color: group.color,
                        background: `${group.color}11`,
                        border: `1px solid ${group.color}33`,
                        fontWeight: 600,
                        minWidth: "180px",
                      }}
                    >
                      {tool.name}
                    </code>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      {tool.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Setup */}
      <section
        id="setup"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "4rem 2rem",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          セットアップ
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "2rem",
          }}
        >
          3ステップで Claude から RunPod を操作開始
        </p>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          {steps.map((step) => (
            <div
              key={step.num}
              style={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "0.75rem",
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </span>
                <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                  {step.title}
                </span>
              </div>
              <p style={{ color: "var(--text-muted)", marginBottom: step.code ? "1rem" : 0 }}>
                {step.desc}
              </p>
              {step.code && (
                <pre
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "1rem",
                    overflow: "auto",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}
                >
                  {step.code}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Environment Variables */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 2rem 4rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          環境変数
        </h2>
        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>変数名</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>必須</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>説明</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <code>RUNPOD_API_KEY</code>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ color: "var(--orange)" }}>必須</span>
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                  RunPod API キー (Settings &gt; API Keys で取得)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p>RunPod MCP Server — Built for Claude</p>
      </footer>
    </>
  );
}
