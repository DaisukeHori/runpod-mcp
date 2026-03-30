/**
 * RunPod API エラーハンドリング
 */

export class RunPodError extends Error {
  public readonly status: number;
  public readonly runpodMessage: string;

  constructor(status: number, message: string) {
    super(`RunPod API Error (${status}): ${message}`);
    this.name = "RunPodError";
    this.status = status;
    this.runpodMessage = message;
  }

  toUserMessage(): string {
    switch (this.status) {
      case 401:
        return (
          "RunPod API キーが無効です。" +
          "RunPod コンソールの Settings > API Keys で再確認してください。"
        );
      case 403:
        return (
          "RunPod API キーの権限が不足しています。" +
          "スコープを確認してください。"
        );
      case 404:
        return "指定されたリソースが見つかりません。IDを確認してください。";
      case 429:
        return (
          "RunPod API のレート制限に達しました。" +
          "しばらく待ってから再試行してください。"
        );
      default:
        if (this.status >= 500) {
          return (
            "RunPod 側でエラーが発生しました。" +
            "しばらく待ってから再試行してください。"
          );
        }
        return `RunPod API エラー: ${this.runpodMessage}`;
    }
  }
}
