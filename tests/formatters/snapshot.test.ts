import { describe, it, expect } from "vitest";
import { formatSnapshot, formatSnapshots } from "../../src/formatters/snapshot.js";

const RAW_SNAPSHOT = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  description: "Pre-training checkpoint",
  status: "complete",
  size: 42949672960,
  os_id: 2284,
  app_id: 0,
  date_created: "2026-04-20T01:30:00+00:00",
  compressed_size: 21474836480,
};

describe("formatSnapshot", () => {
  it("extracts essential fields", () => {
    const result = formatSnapshot(RAW_SNAPSHOT);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.description).toBe("Pre-training checkpoint");
    expect(result.status).toBe("complete");
    expect(result.size).toBe(42949672960);
    expect(result.os_id).toBe(2284);
  });

  it("strips verbose fields", () => {
    const result = formatSnapshot(RAW_SNAPSHOT) as Record<string, unknown>;
    expect(result.compressed_size).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatSnapshot({});
    expect(result.id).toBe("");
    expect(result.status).toBe("");
    expect(result.size).toBe(0);
  });
});

describe("formatSnapshots", () => {
  it("maps array of snapshots", () => {
    const results = formatSnapshots([RAW_SNAPSHOT]);
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe("Pre-training checkpoint");
  });
});
