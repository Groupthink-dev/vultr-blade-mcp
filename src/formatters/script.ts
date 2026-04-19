/**
 * Startup script formatters — strip to essential fields.
 */

interface ConciseScript {
  id: string;
  name: string;
  type: string;
  date_created: string;
  date_modified: string;
}

export function formatScript(raw: Record<string, unknown>): ConciseScript {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    type: String(raw.type ?? ""),
    date_created: String(raw.date_created ?? ""),
    date_modified: String(raw.date_modified ?? ""),
  };
}

export function formatScripts(scripts: Record<string, unknown>[]): ConciseScript[] {
  return scripts.map(formatScript);
}
