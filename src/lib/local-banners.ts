import fs from "node:fs";
import path from "node:path";
import { toGameSlug } from "@/lib/game-slug";
import type { SellAuthCategory, SellAuthGroup, SellAuthProduct } from "@/types/sellauth";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".avif",
]);

const DISPLAY_NAME_BY_SLUG: Record<string, string> = {
  apex: "Apex",
  "arc-raiders": "Arc Raiders",
  "call-of-duty": "Call Of Duty",
  "counter-strike-2": "Counter Strike 2",
  dayz: "DayZ",
  fivem: "FiveM",
  fortnite: "Fortnite",
  "rainbow-six-siege": "Rainbow Six Siege",
  roblox: "Roblox",
  "hwid-spoofers": "HWID Spoofers",
  lol: "League of Legends",
  pubg: "PUBG",
  squad: "Squad",
  valorant: "Valorant",
  rust: "Rust",
};

const ALIASES_BY_SLUG: Record<string, string[]> = {
  apex: ["apex", "apexlegends"],
  "arc-raiders": ["arc", "arcraiders", "ark", "arkraiders"],
  "call-of-duty": ["cod", "callofduty", "mw", "bo6", "bo7"],
  "counter-strike-2": ["cs2", "csgo", "counterstrike2", "counterstrike"],
  dayz: ["dayz"],
  fivem: ["5m", "five", "fivem"],
  fortnite: ["fortnite", "fn"],
  "rainbow-six-siege": ["r6", "r6s", "rainbowsix", "siege", "tomclancy"],
  roblox: ["roblox", "rbx"],
  "hwid-spoofers": [
    "hwid",
    "spoofer",
    "spoofers",
    "hwidspoofer",
    "hwidspoofers",
    "spoof",
  ],
  lol: ["lol", "league", "leagueoflegends"],
  pubg: ["pubg", "battlegrounds", "playerunknown"],
  squad: ["squad"],
  valorant: ["val", "valo", "valorant"],
  rust: ["rust"],
};

const PREFERRED_CATEGORY_SLUGS = [
  "apex",
  "arc-raiders",
  "call-of-duty",
  "counter-strike-2",
  "dayz",
  "fivem",
  "fortnite",
  "hwid-spoofers",
  "lol",
  "pubg",
  "rainbow-six-siege",
  "roblox",
  "rust",
  "valorant",
];

const FALLBACK_CATEGORY_NAMES = [
  "Apex",
  "Arc Raiders",
  "Call Of Duty",
  "Counter Strike 2",
  "DayZ",
  "FiveM",
  "Fortnite",
  "Rainbow Six Siege",
  "HWID Spoofers",
  "League of Legends",
  "PUBG",
  "Roblox",
  "Valorant",
  "Rust",
];
const FALLBACK_CATEGORY_SLUGS = new Set(
  FALLBACK_CATEGORY_NAMES.map((name) => toGameSlug(name))
);

const GROUP_ID_BASE = 52000;
const CATEGORY_ID_BASE = 62000;
const SAMPLE_PRODUCT_ID_BASE = 920000;

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

const ALIAS_TO_SLUG: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [slug, displayName] of Object.entries(DISPLAY_NAME_BY_SLUG)) {
    const tokens = new Set<string>([
      normalizeAliasToken(slug),
      normalizeAliasToken(displayName),
      ...slug.split("-").map(normalizeAliasToken),
      ...(ALIASES_BY_SLUG[slug] || []).map(normalizeAliasToken),
    ]);
    tokens.forEach((token) => {
      if (!token) return;
      map[token] = slug;
    });
  }
  return map;
})();

const ALIAS_MATCH_CANDIDATES = Object.keys(ALIAS_TO_SLUG).sort(
  (a, b) => b.length - a.length
);

function resolveDisplayNameFromAlias(value: string): string | null {
  const token = normalizeAliasToken(value);
  if (!token) return null;
  const exactSlug = ALIAS_TO_SLUG[token];
  if (exactSlug) {
    return DISPLAY_NAME_BY_SLUG[exactSlug] || null;
  }

  for (const alias of ALIAS_MATCH_CANDIDATES) {
    if (!token.includes(alias)) continue;
    const slug = ALIAS_TO_SLUG[alias];
    if (slug) return DISPLAY_NAME_BY_SLUG[slug] || null;
  }

  return null;
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

  const canonicalSlug = ALIAS_TO_SLUG[normalizeAliasToken(slug)] || slug;
  (ALIASES_BY_SLUG[canonicalSlug] || []).forEach(add);

  return [...tokens];
}

function listImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) return [];

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function uniqueBySlug(
  banners: { name: string; imageUrl: string }[]
): { name: string; imageUrl: string }[] {
  const seen = new Set<string>();
  const output: { name: string; imageUrl: string }[] = [];
  for (const banner of banners) {
    const slug = toGameSlug(banner.name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    output.push(banner);
  }
  return output;
}

function prioritizeBanners(
  banners: { name: string; imageUrl: string }[]
): { name: string; imageUrl: string }[] {
  const priority = new Map<string, number>(
    PREFERRED_CATEGORY_SLUGS.map((slug, index) => [slug, index])
  );

  return [...banners].sort((a, b) => {
    const slugA = toGameSlug(a.name);
    const slugB = toGameSlug(b.name);
    const orderA = priority.has(slugA) ? (priority.get(slugA) as number) : Number.MAX_SAFE_INTEGER;
    const orderB = priority.has(slugB) ? (priority.get(slugB) as number) : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) return orderA - orderB;
    return slugA.localeCompare(slugB);
  });
}

function titleCaseFromFileName(fileName: string): string {
  const raw = path.parse(fileName).name.toLowerCase().trim();
  const resolvedFromRaw = resolveDisplayNameFromAlias(raw);
  if (resolvedFromRaw) return resolvedFromRaw;

  const compact = normalizeAliasToken(raw);
  const resolvedFromCompact = resolveDisplayNameFromAlias(compact);
  if (resolvedFromCompact) return resolvedFromCompact;

  return raw
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((segment) =>
      segment.length <= 3
        ? segment.toUpperCase()
        : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join(" ");
}

function syncRootPdPngIntoPublic(projectRoot: string) {
  const rootCandidates = [path.join(projectRoot, "pd.png"), path.join(projectRoot, "pd")];
  const publicPdFolder = path.join(projectRoot, "public", "pd.png");
  const sourceFiles = [...new Set(rootCandidates.flatMap((folder) => listImageFiles(folder)))];
  if (sourceFiles.length === 0) return;

  if (!fs.existsSync(publicPdFolder)) {
    fs.mkdirSync(publicPdFolder, { recursive: true });
  }

  const existingTargets = new Set(listImageFiles(publicPdFolder));
  for (const fileName of sourceFiles) {
    if (existingTargets.has(fileName)) continue;
    const sourcePath = rootCandidates
      .map((folder) => path.join(folder, fileName))
      .find((candidatePath) => fs.existsSync(candidatePath));
    if (!sourcePath) continue;
    fs.copyFileSync(sourcePath, path.join(publicPdFolder, fileName));
  }
}

function ensureApexBanner(banners: { name: string; imageUrl: string }[]) {
  const hasApex = banners.some((banner) => toGameSlug(banner.name) === "apex");
  if (hasApex) return banners;
  const fallbackImage = banners[0]?.imageUrl || "/games/fortnite.svg";
  return [...banners, { name: "Apex", imageUrl: fallbackImage }];
}

function withFallbackNames(
  banners: { name: string; imageUrl: string }[],
  limit: number
): { name: string; imageUrl: string }[] {
  if (banners.length >= limit) return banners.slice(0, limit);

  const used = new Set(banners.map((banner) => toGameSlug(banner.name)));
  const fallbackImage = banners[0]?.imageUrl || "/games/fortnite.svg";
  const filled = [...banners];

  for (const fallbackName of FALLBACK_CATEGORY_NAMES) {
    if (filled.length >= limit) break;
    const slug = toGameSlug(fallbackName);
    if (used.has(slug)) continue;
    filled.push({ name: fallbackName, imageUrl: fallbackImage });
    used.add(slug);
  }

  return filled.slice(0, limit);
}

function readSourceBanners(projectRoot: string): { name: string; imageUrl: string }[] {
  syncRootPdPngIntoPublic(projectRoot);

  const publicCandidates = [
    { fileDir: path.join(projectRoot, "public", "pd"), publicPath: "/pd" },
    { fileDir: path.join(projectRoot, "public", "pd.png"), publicPath: "/pd" },
  ];

  const fromPublicFolders: { name: string; imageUrl: string }[] = [];
  for (const candidate of publicCandidates) {
    const files = listImageFiles(candidate.fileDir);
    for (const fileName of files) {
      fromPublicFolders.push({
        name: titleCaseFromFileName(fileName),
        imageUrl: `${candidate.publicPath}/${fileName}`,
      });
    }
  }

  const uniquePublic = uniqueBySlug(fromPublicFolders);
  if (uniquePublic.length > 0) {
    return prioritizeBanners(uniquePublic);
  }

  const rootCandidates = [path.join(projectRoot, "pd.png"), path.join(projectRoot, "pd")];
  const fromRootFolders: { name: string; imageUrl: string }[] = [];
  for (const candidate of rootCandidates) {
    const files = listImageFiles(candidate);
    for (const fileName of files) {
      fromRootFolders.push({
        name: titleCaseFromFileName(fileName),
        imageUrl: `/pd.png/${fileName}`,
      });
    }
  }

  const uniqueRoot = uniqueBySlug(fromRootFolders);
  if (uniqueRoot.length > 0) {
    return prioritizeBanners(uniqueRoot);
  }

  const gamesFolder = path.join(projectRoot, "public", "games");
  const gameFiles = listImageFiles(gamesFolder);
  if (gameFiles.length > 0) {
    return gameFiles
      .map((fileName) => ({
        name: titleCaseFromFileName(fileName),
        imageUrl: `/games/${fileName}`,
      }))
      .filter((banner) => FALLBACK_CATEGORY_SLUGS.has(toGameSlug(banner.name)));
  }

  return [];
}

export function getLocalCategoryBanners(limit = 14): LocalCategoryBanner[] {
  const source = readSourceBanners(process.cwd());
  const apexEnsured = ensureApexBanner(source);
  const finalBanners = withFallbackNames(apexEnsured, limit);

  return finalBanners.map((banner, index) => {
    const safeName = banner.name || `Category ${index + 1}`;
    return {
      name: safeName,
      slug: toGameSlug(safeName),
      imageUrl: banner.imageUrl,
      groupId: GROUP_ID_BASE + index + 1,
      categoryId: CATEGORY_ID_BASE + index + 1,
    };
  });
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
