import { describe, it, expect } from "vitest";
import { formatSubscription, formatSubscriptions, formatUsage } from "../../src/formatters/inference.js";

const RAW_SUBSCRIPTION = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  label: "prod-inference",
  status: "active",
  api_key: "vul-inf-abc123def456ghi789jkl012mno345",
  date_created: "2026-04-20T01:30:00+00:00",
};

const RAW_USAGE = {
  chat: { current_tokens: 1500000, monthly_allotment: 10000000, overage: 0 },
  completions: { current_tokens: 500000, monthly_allotment: 5000000, overage: 0 },
  embeddings: { current_tokens: 200000, monthly_allotment: 2000000, overage: 0 },
  audio: { current_tokens: 0, monthly_allotment: 1000000, overage: 0 },
};

describe("formatSubscription", () => {
  it("extracts essential fields", () => {
    const result = formatSubscription(RAW_SUBSCRIPTION);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.label).toBe("prod-inference");
    expect(result.status).toBe("active");
  });

  it("masks API key", () => {
    const result = formatSubscription(RAW_SUBSCRIPTION);
    expect(result.api_key_masked).toBe("vul-inf-...");
    expect(result.api_key_masked).not.toContain("abc123");
  });

  it("handles missing API key", () => {
    const result = formatSubscription({ ...RAW_SUBSCRIPTION, api_key: undefined });
    expect(result.api_key_masked).toBe("");
  });

  it("handles missing fields gracefully", () => {
    const result = formatSubscription({});
    expect(result.id).toBe("");
    expect(result.label).toBe("");
  });
});

describe("formatSubscriptions", () => {
  it("maps array", () => {
    const results = formatSubscriptions([RAW_SUBSCRIPTION]);
    expect(results).toHaveLength(1);
  });
});

describe("formatUsage", () => {
  it("formats usage buckets", () => {
    const result = formatUsage("sub-123", RAW_USAGE);
    expect(result.subscription_id).toBe("sub-123");
    expect(result.chat.current_tokens).toBe(1500000);
    expect(result.chat.monthly_allotment).toBe(10000000);
    expect(result.completions.current_tokens).toBe(500000);
    expect(result.audio.current_tokens).toBe(0);
  });

  it("handles empty usage", () => {
    const result = formatUsage("sub-123", {});
    expect(result.chat.current_tokens).toBe(0);
    expect(result.embeddings.monthly_allotment).toBe(0);
  });
});
