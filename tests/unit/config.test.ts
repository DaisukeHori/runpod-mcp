/**
 * Config 単体テスト (8件)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConfig } from "@/lib/config";

describe("getConfig", () => {
  const originalEnv = process.env.RUNPOD_API_KEY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.RUNPOD_API_KEY = originalEnv;
    } else {
      delete process.env.RUNPOD_API_KEY;
    }
  });

  // 1
  it("should throw when RUNPOD_API_KEY is not set", () => {
    delete process.env.RUNPOD_API_KEY;
    expect(() => getConfig()).toThrow("RUNPOD_API_KEY");
  });

  // 2
  it("should return config when RUNPOD_API_KEY is set", () => {
    process.env.RUNPOD_API_KEY = "test-key-123";
    const config = getConfig();
    expect(config.runpodApiKey).toBe("test-key-123");
  });

  // 3
  it("should return correct restBaseUrl", () => {
    process.env.RUNPOD_API_KEY = "test-key";
    const config = getConfig();
    expect(config.restBaseUrl).toBe("https://rest.runpod.io/v1");
  });

  // 4
  it("should return correct graphqlUrl", () => {
    process.env.RUNPOD_API_KEY = "test-key";
    const config = getConfig();
    expect(config.graphqlUrl).toBe("https://api.runpod.io/graphql");
  });

  // 5
  it("should return correct serverlessBaseUrl", () => {
    process.env.RUNPOD_API_KEY = "test-key";
    const config = getConfig();
    expect(config.serverlessBaseUrl).toBe("https://api.runpod.ai/v2");
  });

  // 6
  it("error message should mention Settings", () => {
    delete process.env.RUNPOD_API_KEY;
    expect(() => getConfig()).toThrow("Settings");
  });

  // 7
  it("should accept any non-empty string as API key", () => {
    process.env.RUNPOD_API_KEY = "x";
    expect(() => getConfig()).not.toThrow();
  });

  // 8
  it("should return all four config properties", () => {
    process.env.RUNPOD_API_KEY = "test-key";
    const config = getConfig();
    expect(Object.keys(config)).toHaveLength(4);
    expect(config).toHaveProperty("runpodApiKey");
    expect(config).toHaveProperty("restBaseUrl");
    expect(config).toHaveProperty("graphqlUrl");
    expect(config).toHaveProperty("serverlessBaseUrl");
  });
});
