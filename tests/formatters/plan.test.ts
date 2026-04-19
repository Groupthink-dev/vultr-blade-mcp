import { describe, it, expect } from "vitest";
import { formatPlan, formatPlans } from "../../src/formatters/plan.js";

const RAW_GPU_PLAN = {
  id: "vcg-a100-1c-6g-80gb",
  vcpu_count: 12,
  ram: 65536,
  disk: 400,
  disk_count: 1,
  bandwidth: 5120,
  monthly_cost: 1596,
  hourly_cost: 2.21,
  type: "vcg",
  locations: ["ewr", "ord", "lax"],
  gpu_vram_gb: 80,
  gpu_count: 1,
  gpu_type: "A100",
};

const RAW_CPU_PLAN = {
  id: "vc2-1c-1gb",
  vcpu_count: 1,
  ram: 1024,
  disk: 25,
  disk_count: 1,
  bandwidth: 1024,
  monthly_cost: 5,
  hourly_cost: 0.007,
  type: "vc2",
  locations: ["ewr", "ord", "lax", "syd"],
};

describe("formatPlan", () => {
  it("includes GPU fields for GPU plans", () => {
    const result = formatPlan(RAW_GPU_PLAN);

    expect(result.id).toBe("vcg-a100-1c-6g-80gb");
    expect(result.price_monthly).toBe(1596);
    expect(result.price_hourly).toBe(2.21);
    expect(result.gpu).toBeDefined();
    expect(result.gpu!.vram_gb).toBe(80);
    expect(result.gpu!.count).toBe(1);
    expect(result.locations).toEqual(["ewr", "ord", "lax"]);
  });

  it("omits GPU fields for CPU plans", () => {
    const result = formatPlan(RAW_CPU_PLAN);

    expect(result.id).toBe("vc2-1c-1gb");
    expect(result.gpu).toBeUndefined();
  });

  it("handles missing fields", () => {
    const result = formatPlan({});
    expect(result.id).toBe("");
    expect(result.price_monthly).toBe(0);
    expect(result.locations).toEqual([]);
    expect(result.gpu).toBeUndefined();
  });
});

describe("formatPlans", () => {
  it("maps array of plans", () => {
    const results = formatPlans([RAW_GPU_PLAN, RAW_CPU_PLAN]);
    expect(results).toHaveLength(2);
    expect(results[0].gpu).toBeDefined();
    expect(results[1].gpu).toBeUndefined();
  });
});
