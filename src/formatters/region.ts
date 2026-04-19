/**
 * Region formatters — concise region display.
 */

interface ConciseRegion {
  id: string;
  city: string;
  country: string;
  continent: string;
  options: string[];
}

export function formatRegion(raw: Record<string, unknown>): ConciseRegion {
  return {
    id: String(raw.id ?? ""),
    city: String(raw.city ?? ""),
    country: String(raw.country ?? ""),
    continent: String(raw.continent ?? ""),
    options: Array.isArray(raw.options) ? raw.options.map(String) : [],
  };
}

export function formatRegions(regions: Record<string, unknown>[]): ConciseRegion[] {
  return regions.map(formatRegion);
}
