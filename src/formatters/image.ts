/**
 * OS image formatters.
 */

interface ConciseImage {
  id: number;
  name: string;
  arch: string;
  family: string;
}

export function formatImage(raw: Record<string, unknown>): ConciseImage {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    arch: String(raw.arch ?? ""),
    family: String(raw.family ?? ""),
  };
}

export function formatImages(images: Record<string, unknown>[]): ConciseImage[] {
  return images.map(formatImage);
}
