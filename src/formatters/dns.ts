/**
 * DNS formatters — strip to essential fields.
 */

interface ConciseDomain {
  domain: string;
  date_created: string;
  dns_sec: string;
}

export function formatDomain(raw: Record<string, unknown>): ConciseDomain {
  return {
    domain: String(raw.domain ?? ""),
    date_created: String(raw.date_created ?? ""),
    dns_sec: String(raw.dns_sec ?? "disabled"),
  };
}

export function formatDomains(domains: Record<string, unknown>[]): ConciseDomain[] {
  return domains.map(formatDomain);
}

interface ConciseRecord {
  id: string;
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority: number;
}

export function formatRecord(raw: Record<string, unknown>): ConciseRecord {
  return {
    id: String(raw.id ?? ""),
    type: String(raw.type ?? ""),
    name: String(raw.name ?? ""),
    data: String(raw.data ?? ""),
    ttl: Number(raw.ttl ?? 0),
    priority: Number(raw.priority ?? 0),
  };
}

export function formatRecords(records: Record<string, unknown>[]): ConciseRecord[] {
  return records.map(formatRecord);
}
