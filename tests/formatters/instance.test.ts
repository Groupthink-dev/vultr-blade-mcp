import { describe, it, expect } from "vitest";
import { formatInstance, formatInstances, formatInstanceStatus } from "../../src/formatters/instance.js";

const RAW_INSTANCE = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  os: "Ubuntu 24.04 LTS x64",
  ram: 65536,
  disk: 400,
  main_ip: "149.28.225.123",
  vcpu_count: 12,
  region: "ewr",
  plan: "vcg-a100-1c-6g-80gb",
  date_created: "2026-04-20T01:30:00+00:00",
  status: "active",
  allowed_bandwidth: 5120,
  netmask_v4: "255.255.254.0",
  gateway_v4: "149.28.224.1",
  power_status: "running",
  server_status: "ok",
  v6_main_ip: "2001:19f0:5:1234::1",
  v6_network: "2001:19f0:5:1234::",
  v6_network_size: 64,
  label: "gpu-worker-01",
  internal_ip: "",
  kvm: "https://my.vultr.com/subs/vps/novnc/...",
  hostname: "gpu-worker-01",
  tag: "stallari",
  tags: ["stallari", "gpu-worker"],
  os_id: 2284,
  app_id: 0,
  image_id: "",
  firewall_group_id: "",
  features: ["ipv6"],
  user_scheme: "root",
  pending_charges: "2.21",
  monthly_charges: "0.00",
  // Extra fields that should be stripped
  default_password: "abc123",
  auto_backups: "disabled",
};

describe("formatInstance", () => {
  it("extracts essential fields", () => {
    const result = formatInstance(RAW_INSTANCE);

    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.label).toBe("gpu-worker-01");
    expect(result.hostname).toBe("gpu-worker-01");
    expect(result.status).toBe("active");
    expect(result.power_status).toBe("running");
    expect(result.server_status).toBe("ok");
    expect(result.region).toBe("ewr");
    expect(result.plan).toBe("vcg-a100-1c-6g-80gb");
    expect(result.os).toBe("Ubuntu 24.04 LTS x64");
    expect(result.vcpu_count).toBe(12);
    expect(result.ram_mb).toBe(65536);
    expect(result.disk_gb).toBe(400);
    expect(result.main_ip).toBe("149.28.225.123");
    expect(result.tags).toEqual(["stallari", "gpu-worker"]);
  });

  it("includes IPv6 when present", () => {
    const result = formatInstance(RAW_INSTANCE);
    expect(result.v6_main_ip).toBe("2001:19f0:5:1234::1");
  });

  it("omits IPv6 when empty", () => {
    const result = formatInstance({ ...RAW_INSTANCE, v6_main_ip: "" });
    expect(result.v6_main_ip).toBeUndefined();
  });

  it("strips sensitive fields", () => {
    const result = formatInstance(RAW_INSTANCE) as Record<string, unknown>;
    expect(result.default_password).toBeUndefined();
    expect(result.kvm).toBeUndefined();
    expect(result.internal_ip).toBeUndefined();
    expect(result.netmask_v4).toBeUndefined();
    expect(result.gateway_v4).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatInstance({});
    expect(result.id).toBe("");
    expect(result.label).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.vcpu_count).toBe(0);
  });
});

describe("formatInstances", () => {
  it("maps array of instances", () => {
    const results = formatInstances([RAW_INSTANCE, RAW_INSTANCE]);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
  });
});

describe("formatInstanceStatus", () => {
  it("returns only status fields", () => {
    const result = formatInstanceStatus(RAW_INSTANCE);
    expect(Object.keys(result)).toEqual([
      "id",
      "status",
      "power_status",
      "server_status",
      "main_ip",
    ]);
    expect(result.status).toBe("active");
    expect(result.power_status).toBe("running");
  });
});
