/**
 * 環境変数の管理・バリデーション
 */

export function getConfig() {
  const runpodApiKey = process.env.RUNPOD_API_KEY;

  if (!runpodApiKey) {
    throw new Error(
      "RUNPOD_API_KEY が設定されていません。" +
        "RunPod > Settings > API Keys で取得してください。"
    );
  }

  return {
    runpodApiKey,
    restBaseUrl: "https://rest.runpod.io/v1",
    graphqlUrl: "https://api.runpod.io/graphql",
    serverlessBaseUrl: "https://api.runpod.ai/v2",
  };
}
