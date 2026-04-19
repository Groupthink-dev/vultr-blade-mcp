import { describe, it, expect } from "vitest";
import { formatDomain, formatDomains, formatRecord, formatRecords } from "../../src/formatters/dns.js";

const RAW_DOMAIN = {
  domain: "example.com",
  date_created: "2026-04-20T01:30:00+00:00",
  dns_sec: "enabled",
};

const RAW_RECORD = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  type: "A",
  name: "gpu-worker-01",
  data: "149.28.225.123",
  ttl: 300,
  priority: 0,
};

describe("formatDomain", () => {
  it("extracts essential fields", () => {
    const result = formatDomain(RAW_DOMAIN);
    expect(result.domain).toBe("example.com");
    expect(result.dns_sec).toBe("enabled");
    expect(result.date_created).toBe("2026-04-20T01:30:00+00:00");
  });

  it("defaults dns_sec to disabled", () => {
    const result = formatDomain({});
    expect(result.dns_sec).toBe("disabled");
  });

  it("handles missing fields gracefully", () => {
    const result = formatDomain({});
    expect(result.domain).toBe("");
  });
});

describe("formatDomains", () => {
  it("maps array", () => {
    const results = formatDomains([RAW_DOMAIN, RAW_DOMAIN]);
    expect(results).toHaveLength(2);
  });
});

describe("formatRecord", () => {
  it("extracts essential fields", () => {
    const result = formatRecord(RAW_RECORD);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.type).toBe("A");
    expect(result.name).toBe("gpu-worker-01");
    expect(result.data).toBe("149.28.225.123");
    expect(result.ttl).toBe(300);
    expect(result.priority).toBe(0);
  });

  it("handles missing fields gracefully", () => {
    const result = formatRecord({});
    expect(result.id).toBe("");
    expect(result.type).toBe("");
    expect(result.ttl).toBe(0);
  });
});

describe("formatRecords", () => {
  it("maps array", () => {
    const results = formatRecords([RAW_RECORD]);
    expect(results).toHaveLength(1);
  });
});
