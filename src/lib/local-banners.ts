import { toGameSlug } from "@/lib/game-slug";
import type { SellAuthCategory, SellAuthGroup, SellAuthProduct } from "@/types/sellauth";

const GROUP_ID_BASE = 52000;
const CATEGORY_ID_BASE = 62000;
const SAMPLE_PRODUCT_ID_BASE = 920000;

const ORDERED_BANNERS = [
  { slug: "accounts", name: "Accounts" },
  { slug: "apex", name: "Apex Legends" },
  { slug: "arc-raiders", name: "ARC Raiders" },
  { slug: "call-of-duty", name: "COD" },
  { slug: "counter-strike-2", name: "CS2" },
  { slug: "delta-force", name: "Delta Force" },
  { slug: "escape-from-tarkov", name: "Escape From Tarkov" },
  { slug: "fivem", name: "FiveM" },
  { slug: "fortnite", name: "Fortnite" },
  { slug: "hwid-spoofers", name: "HWID Spoofer" },
  { slug: "lag-switches", name: "Lag Switches" },
  { slug: "lol", name: "League of Legends" },
  { slug: "rainbow-six-siege", name: "Rainbow Six Siege" },
  { slug: "roblox", name: "Roblox" },
  { slug: "rocket-league", name: "Rocket League" },
  { slug: "rust", name: "Rust" },
  { slug: "valorant", name: "Valorant" },
  { slug: "vpns", name: "VPNs" },
] as const;

const ALIASES_BY_SLUG: Record<string, string[]> = {
  accounts: ["accounts", "account", "accs"],
  apex: ["apex", "apexlegends"],
  "arc-raiders": ["arc", "arcraiders", "ark", "arkraiders"],
  "call-of-duty": ["cod", "callofduty", "mw", "bo6", "bo7"],
  "counter-strike-2": ["cs2", "csgo", "counterstrike2", "counterstrike"],
  "delta-force": ["deltaforce", "df", "hawkops"],
  "escape-from-tarkov": ["eft", "tarkov", "escapefromtarkov"],
  fivem: ["5m", "five", "fivem"],
  fortnite: ["fortnite", "fn"],
  "hwid-spoofers": ["hwid", "spoofer", "spoofers", "hwidspoofer", "hwidspoofers", "spoof"],
  "lag-switches": ["lagswitch", "lagswitches", "lag"],
  lol: ["lol", "league", "leagueoflegends"],
  "rainbow-six-siege": ["r6", "r6s", "rainbowsix", "siege"],
  roblox: ["roblox", "rbx"],
  "rocket-league": ["rocketleague", "rl"],
  rust: ["rust"],
  valorant: ["val", "valo", "valorant"],
  vpns: ["vpn", "vpns"],
};

export interface LocalCategoryBanner {
  name: string;
  slug: string;
  imageUrl: string;
  groupId: number;
  categoryId: number;
}

export function normalizeAliasToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function aliasTokensForLabel(label: string): string[] {
  const slug = toGameSlug(label);
  const tokens = new Set<string>();
  const add = (value: string) => {
    const normalized = normalizeAliasToken(value);
    if (normalized) tokens.add(normalized);
  };

  add(label);
  add(slug);
  slug.split("-").forEach(add);
  (ALIASES_BY_SLUG[slug] || []).forEach(add);

  const known = ORDERED_BANNERS.find((item) => item.slug === slug);
  if (known) add(known.name);

  return [...tokens];
}

export function getLocalCategoryBanners(limit = 18): LocalCategoryBanner[] {
  return ORDERED_BANNERS.slice(0, limit).map((item, index) => ({
    name: item.name,
    slug: item.slug,
    imageUrl: `/pd/${item.slug}.${"ext" in item ? item.ext : "png"}`,
    groupId: GROUP_ID_BASE + index + 1,
    categoryId: CATEGORY_ID_BASE + index + 1,
  }));
}

function roundPrice(value: number): number {
  return Number(value.toFixed(2));
}

function descriptionFor(name: string, tier: string): string {
  return `${name} ${tier} package with stable updates, strong visuals, and competitive tuning.`;
}

export function createExampleProductsForBanner(
  banner: LocalCategoryBanner,
  index: number
): SellAuthProduct[] {
  const tiers = [
    { label: "Lite", multiplier: 0.7, stock: 140 },
    { label: "Prime", multiplier: 1, stock: 95 },
    { label: "Elite", multiplier: 1.34, stock: 70 },
  ];
  const base = 14 + index * 2.6;

  return tiers.map((tier, tierIndex) => {
    const productId = SAMPLE_PRODUCT_ID_BASE + index * 10 + tierIndex + 1;
    const price = roundPrice(base * tier.multiplier);
    const variantSeed = productId * 10;

    return {
      id: productId,
      name: `${banner.name} ${tier.label}`,
      description: descriptionFor(banner.name, tier.label),
      image: banner.imageUrl,
      images: [banner.imageUrl],
      price,
      currency: "USD",
      stock: tier.stock - tierIndex * 10,
      groupId: banner.groupId,
      groupName: banner.name,
      categoryId: banner.categoryId,
      categoryName: banner.name,
      variants: [
        { id: variantSeed + 1, name: "24 Hours", price: roundPrice(price * 0.38), stock: 220 },
        { id: variantSeed + 2, name: "7 Days", price, stock: 140 },
        { id: variantSeed + 3, name: "30 Days", price: roundPrice(price * 2.4), stock: 80 },
      ],
    };
  });
}

export function bannersToGroups(banners: LocalCategoryBanner[]): SellAuthGroup[] {
  return banners.map((banner) => ({
    id: banner.groupId,
    name: banner.name,
    description: `${banner.name} category`,
    image: { url: banner.imageUrl },
  }));
}

export function bannersToCategories(
  banners: LocalCategoryBanner[]
): SellAuthCategory[] {
  return banners.map((banner) => ({
    id: banner.categoryId,
    name: banner.name,
    description: `${banner.name} products`,
    image: { url: banner.imageUrl },
  }));
}
