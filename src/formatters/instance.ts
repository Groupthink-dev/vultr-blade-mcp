/**
 * Instance formatters — strip Vultr's verbose instance JSON to essentials.
 *
 * Vultr returns ~40 fields per instance. We expose 10-12 that matter
 * for decision-making: identity, status, GPU, network, cost.
 */

interface ConciseInstance {
  id: string;
  label: string;
  hostname: string;
  status: string;
  power_status: string;
  server_status: string;
  region: string;
  plan: string;
  os: string;
  vcpu_count: number;
  ram_mb: number;
  disk_gb: number;
  main_ip: string;
  v6_main_ip?: string;
  tags: string[];
  cost_per_month: string;
  date_created: string;
}

export function formatInstance(raw: Record<string, unknown>): ConciseInstance {
  const result: ConciseInstance = {
    id: String(raw.id ?? ""),
    label: String(raw.label ?? ""),
    hostname: String(raw.hostname ?? ""),
    status: String(raw.status ?? ""),
    power_status: String(raw.power_status ?? ""),
    server_status: String(raw.server_status ?? ""),
    region: String(raw.region ?? ""),
    plan: String(raw.plan ?? ""),
    os: String(raw.os ?? ""),
    vcpu_count: Number(raw.vcpu_count ?? 0),
    ram_mb: Number(raw.ram ?? 0),
    disk_gb: Number(raw.disk ?? 0),
    main_ip: String(raw.main_ip ?? ""),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    cost_per_month: String((raw as Record<string, unknown>).pending_charges ?? raw.monthly_charges ?? ""),
    date_created: String(raw.date_created ?? ""),
  };

  // Only include IPv6 if present
  const v6 = String(raw.v6_main_ip ?? "");
  if (v6 && v6 !== "") {
    result.v6_main_ip = v6;
  }

  return result;
}

export function formatInstances(instances: Record<string, unknown>[]): ConciseInstance[] {
  return instances.map(formatInstance);
}

interface InstanceStatus {
  id: string;
  status: string;
  power_status: string;
  server_status: string;
  main_ip: string;
}

export function formatInstanceStatus(raw: Record<string, unknown>): InstanceStatus {
  return {
    id: String(raw.id ?? ""),
    status: String(raw.status ?? ""),
    power_status: String(raw.power_status ?? ""),
    server_status: String(raw.server_status ?? ""),
    main_ip: String(raw.main_ip ?? ""),
  };
}

interface BandwidthEntry {
  date: string;
  incoming_bytes: number;
  outgoing_bytes: number;
}

interface BandwidthSummary {
  instance_id: string;
  entries: BandwidthEntry[];
  total_incoming_bytes: number;
  total_outgoing_bytes: number;
}

export function formatBandwidth(
  instanceId: string,
  bandwidth: Record<string, Record<string, unknown>>
): BandwidthSummary {
  let totalIn = 0;
  let totalOut = 0;
  const entries: BandwidthEntry[] = [];

  for (const [date, data] of Object.entries(bandwidth)) {
    const incoming = Number(data.incoming_bytes ?? 0);
    const outgoing = Number(data.outgoing_bytes ?? 0);
    totalIn += incoming;
    totalOut += outgoing;
    entries.push({ date, incoming_bytes: incoming, outgoing_bytes: outgoing });
  }

  return {
    instance_id: instanceId,
    entries,
    total_incoming_bytes: totalIn,
    total_outgoing_bytes: totalOut,
  };
}
