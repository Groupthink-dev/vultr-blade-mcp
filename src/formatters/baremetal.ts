/**
 * Bare metal formatters — strip to essential fields.
 */

interface ConciseBaremetal {
  id: string;
  label: string;
  hostname: string;
  status: string;
  region: string;
  plan: string;
  os: string;
  cpu_count: number;
  ram: string;
  disk: string;
  main_ip: string;
  v6_main_ip?: string;
  tags: string[];
  cost_per_month: string;
  date_created: string;
}

export function formatBaremetal(raw: Record<string, unknown>): ConciseBaremetal {
  const result: ConciseBaremetal = {
    id: String(raw.id ?? ""),
    label: String(raw.label ?? ""),
    hostname: String(raw.hostname ?? ""),
    status: String(raw.status ?? ""),
    region: String(raw.region ?? ""),
    plan: String(raw.plan ?? ""),
    os: String(raw.os ?? ""),
    cpu_count: Number(raw.cpu_count ?? 0),
    ram: String(raw.ram ?? ""),
    disk: String(raw.disk ?? ""),
    main_ip: String(raw.main_ip ?? ""),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    cost_per_month: String(raw.monthly_cost ?? ""),
    date_created: String(raw.date_created ?? ""),
  };

  const v6 = String(raw.v6_main_ip ?? "");
  if (v6 && v6 !== "") {
    result.v6_main_ip = v6;
  }

  return result;
}

export function formatBaremetals(servers: Record<string, unknown>[]): ConciseBaremetal[] {
  return servers.map(formatBaremetal);
}

interface ConciseBaremetalPlan {
  id: string;
  cpu_count: number;
  cpu_model: string;
  cpu_threads: number;
  ram_mb: number;
  disk_gb: number;
  disk_count: number;
  disk_type: string;
  bandwidth_gb: number;
  monthly_cost: number;
  type: string;
  locations: string[];
}

export function formatBaremetalPlan(raw: Record<string, unknown>): ConciseBaremetalPlan {
  return {
    id: String(raw.id ?? ""),
    cpu_count: Number(raw.cpu_count ?? 0),
    cpu_model: String(raw.cpu_model ?? ""),
    cpu_threads: Number(raw.cpu_threads ?? 0),
    ram_mb: Number(raw.ram ?? 0),
    disk_gb: Number(raw.disk ?? 0),
    disk_count: Number(raw.disk_count ?? 0),
    disk_type: String(raw.disk_type ?? ""),
    bandwidth_gb: Number(raw.bandwidth ?? 0),
    monthly_cost: Number(raw.monthly_cost ?? 0),
    type: String(raw.type ?? ""),
    locations: Array.isArray(raw.locations) ? raw.locations.map(String) : [],
  };
}

export function formatBaremetalPlans(plans: Record<string, unknown>[]): ConciseBaremetalPlan[] {
  return plans.map(formatBaremetalPlan);
}
