export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>RunPod MCP Server</h1>
      <p>RunPod GPU FaaS を Claude から操作するための MCP サーバーです。</p>

      <h2>エンドポイント</h2>
      <ul>
        <li>
          <code>/api/mcp</code> — Streamable HTTP (推奨)
        </li>
        <li>
          <code>/api/sse</code> — SSE (後方互換)
        </li>
      </ul>

      <h2>利用可能なツール (15個)</h2>

      <h3>Pod 管理</h3>
      <ul>
        <li><strong>pod_list</strong> — Pod一覧取得</li>
        <li><strong>pod_get</strong> — Pod詳細取得</li>
        <li><strong>pod_create</strong> — Pod作成</li>
        <li><strong>pod_stop</strong> — Pod停止</li>
        <li><strong>pod_terminate</strong> — Pod削除</li>
      </ul>

      <h3>サーバーレス Endpoint 管理</h3>
      <ul>
        <li><strong>endpoint_list</strong> — Endpoint一覧取得</li>
        <li><strong>endpoint_get</strong> — Endpoint詳細取得</li>
        <li><strong>endpoint_create</strong> — Endpoint作成</li>
        <li><strong>endpoint_update</strong> — Endpoint更新</li>
      </ul>

      <h3>サーバーレス Job 実行</h3>
      <ul>
        <li><strong>job_run</strong> — 非同期ジョブ送信</li>
        <li><strong>job_runsync</strong> — 同期ジョブ送信</li>
        <li><strong>job_status</strong> — ジョブステータス確認</li>
        <li><strong>job_cancel</strong> — ジョブキャンセル</li>
      </ul>

      <h3>GPU・アカウント情報</h3>
      <ul>
        <li><strong>gpu_types</strong> — 利用可能なGPU種別一覧</li>
        <li><strong>account_info</strong> — アカウント残高・利用状況</li>
      </ul>

      <h2>セットアップ</h2>
      <p>
        環境変数 <code>RUNPOD_API_KEY</code> に RunPod API キーを設定してください。
      </p>
    </main>
  );
}
