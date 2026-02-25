export function toGameSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isSameGameSlug(value: string, slug: string): boolean {
  return toGameSlug(value) === slug;
}
