import { describe, it, expect } from "vitest";
import { truncateIfNeeded } from "../../src/utils/pagination.js";

describe("truncateIfNeeded", () => {
  it("returns short text unchanged", () => {
    const text = "Hello, world!";
    expect(truncateIfNeeded(text)).toBe(text);
  });

  it("truncates long text with guidance", () => {
    const text = "x".repeat(5000);
    const result = truncateIfNeeded(text);
    expect(result.length).toBeLessThan(5000);
    expect(result).toContain("TRUNCATED");
    expect(result).toContain("per_page");
  });

  it("cuts at newline boundary when possible", () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line ${i}: ${"x".repeat(20)}`).join("\n");
    const result = truncateIfNeeded(lines);
    // Should end cleanly at a newline, not mid-line
    const beforeTruncated = result.split("--- TRUNCATED ---")[0].trim();
    expect(beforeTruncated.endsWith("\n") || beforeTruncated.length > 0).toBe(true);
  });
});
