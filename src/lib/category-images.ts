// Static category images keyed by canonical game slug. Shared by the homepage
// "Shop by Game" tiles and the /products catalog. Replace files in
// public/category/ and bump the _vN suffix to bust Next's image cache.
export const CATEGORY_IMAGES: Record<string, string> = {
  "rust":               "/category/rust_v3.png",
  "fortnite":           "/category/fortnite_v3.png",
  "counter-strike-2":   "/category/cs2_v3.png",
  "arc-raiders":        "/category/arc_raiders_v3.png",
  "rainbow-six-siege":  "/category/r6_v3.png",
  "apex":               "/category/apex_v3.png",
  "call-of-duty":       "/category/cod_v3.png",
  "dayz":               "/category/dayz_v6.png",
  "fivem":              "/category/fivem_v6.png",
  "escape-from-tarkov": "/category/tarkov_v3.png",
  "delta-force":        "/category/delta_force_v1.png",
  "hwid-spoofers":      "/category/spoofer_v3.png",
  "accounts":           "/category/accounts_v3.png",
};

// Curated, ordered list of category tiles shown on the homepage "Shop by Game".
// (Roblox & Valorant intentionally excluded.)
export const CATEGORY_TILES: { slug: string; name: string }[] = [
  { slug: "rust",               name: "Rust" },
  { slug: "fortnite",           name: "Fortnite" },
  { slug: "counter-strike-2",   name: "CS2" },
  { slug: "arc-raiders",        name: "ARC Raiders" },
  { slug: "rainbow-six-siege",  name: "Rainbow Six Siege" },
  { slug: "apex",               name: "Apex Legends" },
  { slug: "call-of-duty",       name: "Call of Duty" },
  { slug: "dayz",               name: "DayZ" },
  { slug: "fivem",              name: "FiveM" },
  { slug: "escape-from-tarkov", name: "Escape From Tarkov" },
  { slug: "delta-force",        name: "Delta Force" },
  { slug: "hwid-spoofers",      name: "HWID Spoofer" },
  { slug: "accounts",           name: "Accounts" },
];
