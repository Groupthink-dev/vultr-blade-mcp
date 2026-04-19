/**
 * Snapshot formatters — strip to essential fields.
 */

interface ConciseSnapshot {
  id: string;
  description: string;
  status: string;
  size: number;
  os_id: number;
  app_id: number;
  date_created: string;
}

export function formatSnapshot(raw: Record<string, unknown>): ConciseSnapshot {
  return {
    id: String(raw.id ?? ""),
    description: String(raw.description ?? ""),
    status: String(raw.status ?? ""),
    size: Number(raw.size ?? 0),
    os_id: Number(raw.os_id ?? 0),
    app_id: Number(raw.app_id ?? 0),
    date_created: String(raw.date_created ?? ""),
  };
}

export function formatSnapshots(snapshots: Record<string, unknown>[]): ConciseSnapshot[] {
  return snapshots.map(formatSnapshot);
}
