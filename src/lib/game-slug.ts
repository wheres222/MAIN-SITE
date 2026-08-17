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

  if (compact === "rocketleague" || compact === "rl") {
    return "rocket-league";
  }

  if (compact === "fivem") {
    return "fivem";
  }

  // "HLL" is what the community and most supplier catalogues call it, so a
  // product named "Ancient HLL" has to resolve to the same slug as the
  // category page or the two never link up.
  //
  // Exact match, not `includes`. productLeafSlug canonicalises every contiguous
  // run of words in a product name longest-first to find the game, so an
  // `includes` test made the whole of "Hell Let Loose Fellas" match itself —
  // stripping the entire name and leaving nothing for the URL. The leaf then
  // fell back to the full slug and produced
  // /products/hell-let-loose/hell-let-loose-fellas.
  if (compact === "hll" || compact === "hellletloose") {
    return "hell-let-loose";
  }

  if (compact.includes("deltaforce") || compact === "df" || compact.includes("hawkops")) {
    return "delta-force";
  }

  if (compact === "eft" || compact.includes("escapefromtarkov") || compact.includes("tarkov")) {
    return "escape-from-tarkov";
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
