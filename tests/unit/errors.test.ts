/**
 * RunPodError 単体テスト (10件)
 */
import { describe, it, expect } from "vitest";
import { RunPodError } from "@/lib/runpod/errors";

describe("RunPodError", () => {
  // 1
  it("should create an error with status and message", () => {
    const err = new RunPodError(400, "Bad request");
    expect(err.status).toBe(400);
    expect(err.runpodMessage).toBe("Bad request");
  });

  // 2
  it("should set name to RunPodError", () => {
    const err = new RunPodError(500, "Server error");
    expect(err.name).toBe("RunPodError");
  });

  // 3
  it("should include status in Error message", () => {
    const err = new RunPodError(404, "Not found");
    expect(err.message).toContain("404");
    expect(err.message).toContain("Not found");
  });

  // 4
  it("should be an instance of Error", () => {
    const err = new RunPodError(500, "fail");
    expect(err).toBeInstanceOf(Error);
  });

  // 5 - toUserMessage 401
  it("toUserMessage returns auth message for 401", () => {
    const err = new RunPodError(401, "Unauthorized");
    expect(err.toUserMessage()).toContain("API キーが無効");
  });

  // 6 - toUserMessage 403
  it("toUserMessage returns permission message for 403", () => {
    const err = new RunPodError(403, "Forbidden");
    expect(err.toUserMessage()).toContain("権限が不足");
  });

  // 7 - toUserMessage 404
  it("toUserMessage returns not-found message for 404", () => {
    const err = new RunPodError(404, "Not found");
    expect(err.toUserMessage()).toContain("見つかりません");
  });

  // 8 - toUserMessage 429
  it("toUserMessage returns rate-limit message for 429", () => {
    const err = new RunPodError(429, "Too many requests");
    expect(err.toUserMessage()).toContain("レート制限");
  });

  // 9 - toUserMessage 500
  it("toUserMessage returns server-error message for 500+", () => {
    const err = new RunPodError(502, "Bad gateway");
    expect(err.toUserMessage()).toContain("RunPod 側でエラー");
  });

  // 10 - toUserMessage default
  it("toUserMessage returns raw message for other codes", () => {
    const err = new RunPodError(422, "Validation failed");
    expect(err.toUserMessage()).toContain("Validation failed");
  });
});
