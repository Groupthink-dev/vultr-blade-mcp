import { describe, it, expect } from "vitest";
import {
  formatBaremetal,
  formatBaremetals,
  formatBaremetalPlan,
  formatBaremetalPlans,
} from "../../src/formatters/baremetal.js";

const RAW_BAREMETAL = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  label: "metal-01",
  hostname: "metal-01",
  status: "active",
  region: "ewr",
  plan: "vbm-4c-32gb",
  os: "Ubuntu 24.04 LTS x64",
  cpu_count: 4,
  ram: "32768 MB",
  disk: "2x 480 GB SSD",
  main_ip: "149.28.225.123",
  v6_main_ip: "2001:19f0:5:1234::1",
  tags: ["gpu-metal"],
  monthly_cost: 120,
  date_created: "2026-04-20T01:30:00+00:00",
  netmask_v4: "255.255.254.0",
  gateway_v4: "149.28.224.1",
  mac_address: "5A:F4:04:E2:13:88",
};

const RAW_PLAN = {
  id: "vbm-4c-32gb",
  cpu_count: 4,
  cpu_model: "E-2388G",
  cpu_threads: 16,
  ram: 32768,
  disk: 480,
  disk_count: 2,
  disk_type: "SSD",
  bandwidth: 5120,
  monthly_cost: 120,
  type: "SSD",
  locations: ["ewr", "lax"],
};

describe("formatBaremetal", () => {
  it("extracts essential fields", () => {
    const result = formatBaremetal(RAW_BAREMETAL);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.label).toBe("metal-01");
    expect(result.status).toBe("active");
    expect(result.region).toBe("ewr");
    expect(result.plan).toBe("vbm-4c-32gb");
    expect(result.cpu_count).toBe(4);
    expect(result.tags).toEqual(["gpu-metal"]);
  });

  it("includes IPv6 when present", () => {
    const result = formatBaremetal(RAW_BAREMETAL);
    expect(result.v6_main_ip).toBe("2001:19f0:5:1234::1");
  });

  it("strips sensitive fields", () => {
    const result = formatBaremetal(RAW_BAREMETAL) as Record<string, unknown>;
    expect(result.mac_address).toBeUndefined();
    expect(result.netmask_v4).toBeUndefined();
    expect(result.gateway_v4).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatBaremetal({});
    expect(result.id).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.cpu_count).toBe(0);
  });
});

describe("formatBaremetals", () => {
  it("maps array", () => {
    const results = formatBaremetals([RAW_BAREMETAL]);
    expect(results).toHaveLength(1);
  });
});

describe("formatBaremetalPlan", () => {
  it("extracts essential fields", () => {
    const result = formatBaremetalPlan(RAW_PLAN);
    expect(result.id).toBe("vbm-4c-32gb");
    expect(result.cpu_count).toBe(4);
    expect(result.cpu_model).toBe("E-2388G");
    expect(result.monthly_cost).toBe(120);
    expect(result.locations).toEqual(["ewr", "lax"]);
  });

  it("handles missing fields gracefully", () => {
    const result = formatBaremetalPlan({});
    expect(result.id).toBe("");
    expect(result.cpu_count).toBe(0);
    expect(result.locations).toEqual([]);
  });
});

describe("formatBaremetalPlans", () => {
  it("maps array", () => {
    const results = formatBaremetalPlans([RAW_PLAN]);
    expect(results).toHaveLength(1);
  });
});
