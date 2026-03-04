export function toGameSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function canonicalGameSlug(value: string): string {
  const slug = toGameSlug(value || "");
  const compact = slug.replace(/-/g, "");

  if (
    compact === "r6" ||
    compact === "r6s" ||
    compact.includes("rainbowsixsiege") ||
    compact.includes("rainbow6siege") ||
    compact.includes("rainbowsixseige") ||
    compact.includes("rainbow6seige")
  ) {
    return "rainbow-six-siege";
  }

  if (compact === "lol" || compact.includes("leagueoflegends")) {
    return "league-of-legends";
  }

  if (compact === "cs2" || compact.includes("counterstrike2")) {
    return "counter-strike-2";
  }

  if (compact.includes("apexlegends")) {
    return "apex";
  }

  if (compact === "cod" || compact.includes("callofduty") || compact.includes("warzone")) {
    return "call-of-duty";
  }

  if (compact === "dayz") {
    return "dayz";
  }

  if (compact === "fivem") {
    return "fivem";
  }

  if (compact.includes("hwidspoofer")) {
    return "hwid-spoofers";
  }

  if (compact === "vpn" || compact === "vpns") {
    return "vpns";
  }

  return slug;
}

export function isSameGameSlug(value: string, slug: string): boolean {
  return canonicalGameSlug(value) === canonicalGameSlug(slug);
}
