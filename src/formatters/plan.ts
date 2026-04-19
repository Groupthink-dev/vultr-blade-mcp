/**
 * Plan formatters — GPU-aware plan display with pricing.
 *
 * GPU fields are first-class: name, vram, count are extracted from
 * Vultr's gpu_* fields and presented prominently.
 */

interface ConcisePlan {
  id: string;
  type: string;
  vcpu_count: number;
  ram_mb: number;
  disk_gb: number;
  bandwidth_gb: number;
  price_monthly: number;
  price_hourly: number;
  gpu?: {
    type: string;
    vram_gb: number;
    count: number;
  };
  locations: string[];
}

export function formatPlan(raw: Record<string, unknown>): ConcisePlan {
  const result: ConcisePlan = {
    id: String(raw.id ?? ""),
    type: String(raw.type ?? ""),
    vcpu_count: Number(raw.vcpu_count ?? 0),
    ram_mb: Number(raw.ram ?? 0),
    disk_gb: Number(raw.disk ?? 0),
    bandwidth_gb: Number(raw.bandwidth ?? 0),
    price_monthly: Number(raw.monthly_cost ?? 0),
    price_hourly: Number(raw.hourly_cost ?? 0),
    locations: Array.isArray(raw.locations) ? raw.locations.map(String) : [],
  };

  // GPU fields — only include if present
  const gpuType = raw.gpu_type ?? raw.gpu_vram_gb ? "GPU" : null;
  const gpuVram = Number(raw.gpu_vram_gb ?? 0);
  const gpuCount = Number(raw.gpu_count ?? 0);

  if (gpuVram > 0 || gpuCount > 0) {
    result.gpu = {
      type: String(gpuType ?? ""),
      vram_gb: gpuVram,
      count: gpuCount || 1,
    };
  }

  return result;
}

export function formatPlans(plans: Record<string, unknown>[]): ConcisePlan[] {
  return plans.map(formatPlan);
}
