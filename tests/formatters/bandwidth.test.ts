import { describe, it, expect } from "vitest";
import { formatBandwidth } from "../../src/formatters/instance.js";

describe("formatBandwidth", () => {
  it("aggregates bandwidth entries", () => {
    const raw = {
      "2026-04-19": { incoming_bytes: 1000, outgoing_bytes: 2000 },
      "2026-04-20": { incoming_bytes: 3000, outgoing_bytes: 4000 },
    };
    const result = formatBandwidth("inst-123", raw);
    expect(result.instance_id).toBe("inst-123");
    expect(result.entries).toHaveLength(2);
    expect(result.total_incoming_bytes).toBe(4000);
    expect(result.total_outgoing_bytes).toBe(6000);
  });

  it("handles empty bandwidth", () => {
    const result = formatBandwidth("inst-123", {});
    expect(result.entries).toHaveLength(0);
    expect(result.total_incoming_bytes).toBe(0);
    expect(result.total_outgoing_bytes).toBe(0);
  });

  it("handles missing byte fields", () => {
    const raw = { "2026-04-20": {} };
    const result = formatBandwidth("inst-123", raw);
    expect(result.entries[0].incoming_bytes).toBe(0);
    expect(result.entries[0].outgoing_bytes).toBe(0);
  });
});
