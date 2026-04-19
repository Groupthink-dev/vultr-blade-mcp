/**
 * SSH key formatters — strip key material, show metadata only.
 */

interface ConciseSshKey {
  id: string;
  name: string;
  date_created: string;
}

export function formatSshKey(raw: Record<string, unknown>): ConciseSshKey {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    date_created: String(raw.date_created ?? ""),
  };
}

export function formatSshKeys(keys: Record<string, unknown>[]): ConciseSshKey[] {
  return keys.map(formatSshKey);
}
