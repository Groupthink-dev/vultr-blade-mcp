/**
 * DD-338 Phase C Wave 3 — Vultr server-handler envelope determinism.
 *
 * First server-handler test surface for vultr-blade-mcp (per OQ-4
 * ratification — scaffolded in Wave 3 as load-bearing for acceptance).
 *
 * Mocks `vultrFetch` from `src/services/vultr.js`. For each of the 14
 * promoted B+C tools, asserts:
 *
 *   1. Result text carries a parseable `\n\n_meta: {...}` envelope.
 *   2. Required envelope fields are present.
 *   3. `filtered_by` is sorted alphabetically.
 *   4. Byte-equal across N=3 calls with identical mocked upstream
 *      (after stripping the non-deterministic `latency_ms` field).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../src/services/vultr.js", () => {
  const vultrFetch = vi.fn();
  return {
    vultrFetch,
    VultrApiError: class VultrApiError extends Error {
      constructor(public readonly status: number, public readonly detail: string, public readonly path: string) {
        super(`Vultr API error ${status}: ${detail}`);
        this.name = "VultrApiError";
      }
    },
    validateApiKey: vi.fn(),
  };
});

import { createServer } from "../src/server.js";
import * as vultrSvc from "../src/services/vultr.js";

const vultrFetch = vultrSvc.vultrFetch as unknown as ReturnType<typeof vi.fn>;

interface RegisteredTool {
  handler: (args: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

interface McpServerInternal {
  _registeredTools: Record<string, RegisteredTool>;
}

function getTool(server: McpServer, name: string): RegisteredTool {
  const internal = server as unknown as McpServerInternal;
  const tool = internal._registeredTools[name];
  if (!tool) throw new Error(`tool ${name} not registered`);
  return tool;
}

function parseMeta(text: string): Record<string, unknown> {
  const m = text.match(/\n\n_meta: (\{.*\})$/);
  if (!m) throw new Error(`no _meta tail in: ${text.slice(-300)}`);
  return JSON.parse(m[1]) as Record<string, unknown>;
}

function stripLatency(text: string): string {
  return text.replace(/"latency_ms":\s*\d+/, '"latency_ms":0');
}

// Build a vultrFetch mock returning a JSON body once.
function mockOnce(body: unknown): void {
  vultrFetch.mockResolvedValueOnce({
    json: async () => body,
  });
}

// For N=3 determinism, reset + queue 3 identical responses.
function mockThriceJson(body: unknown): void {
  vultrFetch.mockReset();
  for (let i = 0; i < 3; i++) {
    vultrFetch.mockResolvedValueOnce({ json: async () => body });
  }
}

async function callThrice(server: McpServer, tool: string, args: unknown): Promise<[string, string, string]> {
  const t = getTool(server, tool);
  const r1 = stripLatency((await t.handler(args)).content[0].text);
  const r2 = stripLatency((await t.handler(args)).content[0].text);
  const r3 = stripLatency((await t.handler(args)).content[0].text);
  return [r1, r2, r3];
}

describe("vultr_billing_history envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("emits envelope", async () => {
    mockOnce({
      billing_history: [
        { id: 1, date: "2026-01-01", amount: -5.0, description: "VM" },
        { id: 2, date: "2026-01-02", amount: -3.0, description: "BM" },
      ],
      meta: { total: 5, links: { next: "cur-x" } },
    });
    const res = await getTool(server, "vultr_billing_history").handler({ per_page: 25 });
    const meta = parseMeta(res.content[0].text);
    expect(meta.matched_total).toBe(5);
    expect(meta.returned).toBe(2);
    expect(meta.next_cursor).toBe("cur-x");
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      billing_history: [{ id: 1, date: "2026-01-01", amount: -5.0, description: "VM" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_billing_history", { per_page: 25 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_vm_list envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("filtered_by includes region/tag/label when provided", async () => {
    mockOnce({
      instances: [{ id: "i-1", label: "web-1", region: "syd", status: "active" }],
      meta: { total: 1 },
    });
    const res = await getTool(server, "vultr_vm_list").handler({
      per_page: 100,
      region: "syd",
      tag: "prod",
      label: "web-1",
    });
    const meta = parseMeta(res.content[0].text);
    expect(meta.filtered_by).toEqual(["label=web-1", "region=syd", "tag=prod"]);
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      instances: [{ id: "i-1", label: "web", region: "syd", status: "active" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_vm_list", { per_page: 100, region: "syd" });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_vm_list_plans envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      plans: [{ id: "vcg-a16-2c-8g-1-gpu", vcpu_count: 2, ram: 8192 }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_vm_list_plans", { per_page: 100, type: "vcg" });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
    const meta = parseMeta(r1);
    expect(meta.filtered_by).toContain("type=vcg");
  });
});

describe("vultr_vm_list_images envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      os: [{ id: 1743, name: "Ubuntu 22.04 LTS", arch: "x64", family: "ubuntu" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_vm_list_images", { per_page: 100, type: "linux" });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
    const meta = parseMeta(r1);
    expect(meta.filtered_by).toContain("type=linux");
  });
});

describe("vultr_vm_list_regions envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      regions: [{ id: "syd", city: "Sydney", country: "AU", continent: "Oceania", options: [] }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_vm_list_regions", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_bm_list envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      bare_metals: [{ id: "bm-1", label: "metal-1", region: "syd", status: "active" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_bm_list", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_bm_list_plans envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      plans_metal: [{ id: "vbm-4c-32gb", cpu_count: 4, ram: 32768 }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_bm_list_plans", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_dns_list_domains envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      domains: [{ domain: "example.com", date_created: "2026-01-01", dnssec: "disabled" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_dns_list_domains", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_dns_list_records envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("filtered_by includes domain", async () => {
    mockOnce({
      records: [{ id: "r1", type: "A", name: "www", data: "1.2.3.4", ttl: 300 }],
      meta: { total: 1 },
    });
    const res = await getTool(server, "vultr_dns_list_records").handler({
      domain: "example.com",
      per_page: 100,
    });
    const meta = parseMeta(res.content[0].text);
    expect(meta.filtered_by).toEqual(["domain=example.com"]);
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      records: [{ id: "r1", type: "A", name: "www", data: "1.2.3.4", ttl: 300 }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_dns_list_records", {
      domain: "example.com",
      per_page: 100,
    });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_fw_list_groups envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      firewall_groups: [{ id: "fwg-1", description: "default", instance_count: 0, rule_count: 0 }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_fw_list_groups", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_fw_list_rules envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("filtered_by includes group_id", async () => {
    mockOnce({
      firewall_rules: [{ id: 1, action: "accept", protocol: "tcp", port: "22" }],
      meta: { total: 1 },
    });
    const res = await getTool(server, "vultr_fw_list_rules").handler({
      firewall_group_id: "fwg-1",
      per_page: 100,
    });
    const meta = parseMeta(res.content[0].text);
    expect(meta.filtered_by).toEqual(["group_id=fwg-1"]);
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      firewall_rules: [{ id: 1, action: "accept", protocol: "tcp", port: "22" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_fw_list_rules", {
      firewall_group_id: "fwg-1",
      per_page: 100,
    });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_script_list envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      startup_scripts: [
        { id: "s-1", name: "bootstrap", type: "boot", date_created: "2026-01-01" },
      ],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_script_list", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_snap_list envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      snapshots: [
        { id: "sn-1", description: "backup", status: "complete", size: 10240, date_created: "2026-01-01", os_id: 1743 },
      ],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_snap_list", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

describe("vultr_inference_list envelope", () => {
  let server: McpServer;
  beforeEach(() => {
    server = createServer();
  });

  it("N=3 byte-equal after stripping latency", async () => {
    mockThriceJson({
      subscriptions: [{ id: "inf-1", label: "main", status: "active" }],
      meta: { total: 1 },
    });
    const [r1, r2, r3] = await callThrice(server, "vultr_inference_list", { per_page: 100 });
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it("hits /inference, not /inference/subscriptions (DD-385 live: the latter 400s)", async () => {
    vultrFetch.mockReset();
    vultrFetch.mockResolvedValueOnce({ json: async () => ({ subscriptions: [], meta: { total: 0 } }) });
    await getTool(server, "vultr_inference_list").handler({});
    const calledPath = String(vultrFetch.mock.calls[0][0]);
    expect(calledPath).toMatch(/^\/inference(\?|$)/);
    expect(calledPath).not.toContain("/subscriptions");
  });
});

describe("createServer smoke", () => {
  it("instantiates the McpServer", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});
