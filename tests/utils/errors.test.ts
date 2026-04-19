import { describe, it, expect } from "vitest";
import { handleApiError } from "../../src/utils/errors.js";
import { VultrApiError } from "../../src/services/vultr.js";

describe("handleApiError", () => {
  it("handles 401 with actionable message", () => {
    const error = new VultrApiError(401, "Invalid API token", "/instances");
    const result = handleApiError(error);
    expect(result).toContain("401");
    expect(result).toContain("VULTR_API_KEY");
    // Must NOT contain the actual key value
    expect(result).not.toContain("Invalid API token");
  });

  it("handles 403 with permissions hint", () => {
    const error = new VultrApiError(403, "Forbidden", "/instances");
    const result = handleApiError(error);
    expect(result).toContain("403");
    expect(result).toContain("permissions");
  });

  it("handles 404 with check hint", () => {
    const error = new VultrApiError(404, "Not found", "/instances/abc");
    const result = handleApiError(error);
    expect(result).toContain("404");
    expect(result).toContain("instance ID");
  });

  it("handles 429 rate limit", () => {
    const error = new VultrApiError(429, "Too many requests", "/instances");
    const result = handleApiError(error);
    expect(result).toContain("429");
    expect(result).toContain("rate limit");
  });

  it("handles generic Error", () => {
    const error = new Error("Something broke");
    const result = handleApiError(error);
    expect(result).toContain("Something broke");
  });

  it("handles network errors", () => {
    const error = new Error("fetch failed");
    const result = handleApiError(error);
    expect(result).toContain("network connectivity");
  });

  it("handles non-Error values", () => {
    const result = handleApiError("string error");
    expect(result).toContain("string error");
  });
});
