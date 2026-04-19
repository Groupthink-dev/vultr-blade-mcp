import { describe, it, expect } from "vitest";
import { formatScript, formatScripts } from "../../src/formatters/script.js";

const RAW_SCRIPT = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  name: "gpu-worker-init",
  type: "boot",
  date_created: "2026-04-20T01:30:00+00:00",
  date_modified: "2026-04-20T02:00:00+00:00",
  script: "IyEvYmluL2Jhc2gKZWNobyAiaGVsbG8i",
};

describe("formatScript", () => {
  it("extracts essential fields", () => {
    const result = formatScript(RAW_SCRIPT);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.name).toBe("gpu-worker-init");
    expect(result.type).toBe("boot");
    expect(result.date_created).toBe("2026-04-20T01:30:00+00:00");
    expect(result.date_modified).toBe("2026-04-20T02:00:00+00:00");
  });

  it("strips script content", () => {
    const result = formatScript(RAW_SCRIPT) as Record<string, unknown>;
    expect(result.script).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatScript({});
    expect(result.id).toBe("");
    expect(result.name).toBe("");
    expect(result.type).toBe("");
  });
});

describe("formatScripts", () => {
  it("maps array of scripts", () => {
    const results = formatScripts([RAW_SCRIPT, RAW_SCRIPT]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("gpu-worker-init");
  });
});
