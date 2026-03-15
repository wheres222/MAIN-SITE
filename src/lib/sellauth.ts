import { mockStorefrontData } from "@/lib/mock-data";
import { toGameSlug } from "@/lib/game-slug";
import {
  bannersToCategories,
  bannersToGroups,
  getLocalCategoryBanners,
} from "@/lib/local-banners";
import type {
  CheckoutRequestInput,
  SellAuthCategory,
  SellAuthGroup,
  SellAuthPaymentMethod,
  SellAuthProduct,
  SellAuthProductTab,
  SellAuthVariant,
  StorefrontData,
} from "@/types/sellauth";

type GenericRecord = Record<string, unknown>;

interface ApiEnvelope<T> {
  error?: boolean;
  message?: string;
  data?: T;
}

export class SellAuthRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(`${status} ${message}`);
    this.name = "SellAuthRequestError";
    this.status = status;
  }
}

function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return "";

  let normalized = value.trim();

  // Accept accidental quoted values in dashboard env editors.
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  // Accept escaped pipe from copy/paste attempts.
  normalized = normalized.replace(/\\\|/g, "|");

  return normalized;
}

const SELLAUTH_BASE_URL =
  normalizeEnvSecret(process.env.SELLAUTH_API_BASE_URL) || "https://api.sellauth.com";
const SELLAUTH_SHOP_ID = normalizeEnvSecret(process.env.SELLAUTH_SHOP_ID) || "";
const SELLAUTH_API_KEY = normalizeEnvSecret(process.env.SELLAUTH_API_KEY) || "";
const PRODUCT_IMAGE_PLACEHOLDER = "/placeholders/product-image-not-added.svg";
const STOREFRONT_CACHE_TTL_MS = 25_000;
const SELLAUTH_PAGE_SIZE = 100;
const SELLAUTH_MAX_PAGES = 40;

let storefrontCache:
  | {
      data: StorefrontData;
      expiresAt: number;
    }
  | null = null;

const productImageCache = new Map<number, string>();
const productDetailCache = new Map<number, Partial<SellAuthProduct>>();

function isSellAuthConfigured(): boolean {
  return Boolean(SELLAUTH_SHOP_ID && SELLAUTH_API_KEY);
}

function cloneStorefront(data: StorefrontData): StorefrontData {
  return {
    ...data,
    products: data.products.map((product) => ({
      ...product,
      images: [...(product.images || [])],
      variants: product.variants.map((variant) => ({ ...variant })),
      tabs: product.tabs?.map((tab) => ({ ...tab, items: [...tab.items] })) || [],
    })),
    groups: data.groups.map((group) => ({
      ...group,
      image: group.image ? { ...group.image } : null,
    })),
    categories: data.categories.map((category) => ({
      ...category,
      image: category.image ? { ...category.image } : null,
    })),
    paymentMethods: data.paymentMethods.map((method) => ({ ...method })),
    warnings: [...data.warnings],
  };
}

function getCachedStorefront(): StorefrontData | null {
  if (!storefrontCache) return null;
  if (Date.now() > storefrontCache.expiresAt) return null;
  return cloneStorefront(storefrontCache.data);
}

function setCachedStorefront(data: StorefrontData) {
  storefrontCache = {
    data: cloneStorefront(data),
    expiresAt: Date.now() + STOREFRONT_CACHE_TTL_MS,
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asRecord(value: unknown): GenericRecord {
  return typeof value === "object" && value !== null
    ? (value as GenericRecord)
    : {};
}

function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function unwrapCollection(value: unknown, keys: string[]): unknown[] {
  const direct = toArray(value);
  if (direct.length > 0) return direct;

  const root = asRecord(value);
  for (const key of keys) {
    const directKeyValue = toArray(root[key]);
    if (directKeyValue.length > 0) return directKeyValue;

    const nestedRecord = asRecord(root[key]);
    const nestedData = toArray(nestedRecord.data);
    if (nestedData.length > 0) return nestedData;
  }

  const dataRecord = asRecord(root.data);
  for (const key of keys) {
    const dataKeyValue = toArray(dataRecord[key]);
    if (dataKeyValue.length > 0) return dataKeyValue;
  }

  return [];
}

function fallbackGameImage(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("fortnite")) return "/games/fortnite.svg";
  if (normalized.includes("hwid") || normalized.includes("spoofer"))
    return "/games/hwid.svg";
  if (normalized.includes("duty") || normalized.includes("cod"))
    return "/games/cod.svg";
  if (normalized.includes("rust")) return "/games/rust.svg";
  return "/games/fortnite.svg";
}

function looksLikeImagePath(value: string): boolean {
  return /(\.png|\.jpe?g|\.webp|\.gif|\.avif|\.svg)(\?|$)/i.test(value);
}

function normalizeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return trimmed;

  // Ignore obvious non-image tokens.
  if (
    trimmed.startsWith("data:") ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    /^#[0-9a-f]{3,8}$/i.test(trimmed)
  ) {
    return "";
  }

  // Many providers return relative paths without file extension.
  if (looksLikeImagePath(trimmed) || trimmed.includes("/") || trimmed.includes("uploads")) {
    return `${SELLAUTH_BASE_URL.replace(/\/$/, "")}/${trimmed.replace(/^\/+/, "")}`;
  }

  return "";
}

const IMAGE_PREFERRED_KEYS = [
  "url",
  "src",
  "image",
  "image_url",
  "imageUrl",
  "product_image",
  "productImage",
  "featured_image",
  "featuredImage",
  "main_image",
  "mainImage",
  "cover",
  "banner",
  "thumbnail",
  "thumbnail_url",
  "thumb",
  "preview",
  "preview_image",
  "photo",
  "media_url",
  "asset_url",
  "icon",
  "avatar",
  "filename",
  "file",
  "path",
  "cdn_url",
];

function extractImageCandidate(value: unknown, depth = 0): string {
  if (depth > 4 || value === null || value === undefined) return "";

  if (typeof value === "string") {
    return normalizeImageUrl(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractImageCandidate(entry, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  const record = value as GenericRecord;

  // First pass: known common image keys.
  for (const key of IMAGE_PREFERRED_KEYS) {
    const found = extractImageCandidate(record[key], depth + 1);
    if (found) return found;
  }

  // Second pass: brute-force unknown keys (some providers use nonstandard names).
  for (const entry of Object.values(record)) {
    const found = extractImageCandidate(entry, depth + 1);
    if (found) return found;
  }

  return "";
}

function extractImageCandidates(value: unknown, depth = 0, seen = new Set<string>()): string[] {
  if (depth > 4 || value === null || value === undefined) return [...seen];

  if (typeof value === "string") {
    const normalized = normalizeImageUrl(value);
    if (normalized) seen.add(normalized);
    return [...seen];
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      extractImageCandidates(entry, depth + 1, seen);
    }
    return [...seen];
  }

  if (typeof value !== "object") return [...seen];

  const record = value as GenericRecord;

  for (const key of IMAGE_PREFERRED_KEYS) {
    extractImageCandidates(record[key], depth + 1, seen);
  }

  for (const entry of Object.values(record)) {
    extractImageCandidates(entry, depth + 1, seen);
  }

  return [...seen];
}

const CANONICAL_CATEGORY_ALIASES: Record<string, string> = {
  "apex-legends": "apex",
  apexlegends: "apex",
  cs2: "counter-strike-2",
  counterstrike2: "counter-strike-2",
  "counter-strike2": "counter-strike-2",
  r6: "rainbow-six-siege",
  r6s: "rainbow-six-siege",
  "r6-siege": "rainbow-six-siege",
  "rainbow-6-siege": "rainbow-six-siege",
  rainbow6siege: "rainbow-six-siege",
  rainbowsixsiege: "rainbow-six-siege",
  rainbowsixseige: "rainbow-six-siege",
  callofduty: "call-of-duty",
  cod: "call-of-duty",
  b07: "call-of-duty",
  wz: "call-of-duty",
  wzexternal: "call-of-duty",
  b07wzexternal: "call-of-duty",
  lol: "league-of-legends",
  leagueoflegends: "league-of-legends",
  arcraiders: "arc-raiders",
  dayz: "dayz",
  fivem: "fivem",
  hwidspoofers: "hwid-spoofers",
  vpn: "vpns",
};

function canonicalCategorySlug(name: string): string {
  const slug = toGameSlug(name);
  if (!slug) return "";
  const compact = slug.replace(/-/g, "");
  return CANONICAL_CATEGORY_ALIASES[slug] || CANONICAL_CATEGORY_ALIASES[compact] || slug;
}

const CATEGORY_LABEL_BY_SLUG: Record<string, string> = {
  rust: "Rust",
  "arc-raiders": "Arc-raiders",
  fortnite: "Fortnite",
  apex: "Apex-legends",
  "counter-strike-2": "CS2",
  "rainbow-six-siege": "Rainbow Six Siege",
  "call-of-duty": "COD",
  fivem: "Fivem",
  dayz: "Dayz",
  roblox: "Roblox",
  valorant: "Valorant",
  pubg: "PUBG",
  "hwid-spoofers": "HWID Spoofers",
  accounts: "Accounts",
  vpns: "VPNS",
  "league-of-legends": "League of Legends",
};

function labelForCategorySlug(slug: string): string {
  return CATEGORY_LABEL_BY_SLUG[slug] || slug;
}

function inferCategoryNameFromProduct(product: SellAuthProduct): string {
  const text = `${product.name} ${product.description} ${product.variants
    .map((variant) => variant.name)
    .join(" ")}`.toLowerCase();

  if (/(\bnitro\b|\bmail\b|\baccount\b)/i.test(text)) return "Accounts";
  if (/(\bvpn\b|ip vanish|cyberghost)/i.test(text)) return "VPNS";
  if (/(\bhwid\b|\bspoofer\b)/i.test(text)) return "HWID Spoofers";
  if (/\br6\b|rainbow\s*six/i.test(text)) return "Rainbow Six Siege";
  if (/counter\s*strike|\bcs2\b/i.test(text)) return "CS2";
  if (/call\s*of\s*duty|\bcod\b|warzone|\bb0?7\b|\bwz\b/i.test(text)) return "COD";
  if (/^\s*(?:b0?7\s*)?(?:wz\s*)?(?:internal|external)\s*$/i.test(product.name)) return "COD";
  if (/apex/i.test(text)) return "Apex-legends";
  if (/fortnite/i.test(text)) return "Fortnite";
  if (/arc\s*raiders/i.test(text)) return "Arc-raiders";
  if (/rust/i.test(text)) return "Rust";
  if (/dayz/i.test(text)) return "Dayz";
  if (/fivem/i.test(text)) return "Fivem";
  if (/roblox/i.test(text)) return "Roblox";
  if (/valorant/i.test(text)) return "Valorant";
  if (/\bpubg\b/i.test(text)) return "PUBG";

  return "";
}

async function fetchSellAuth<T>(
  path: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${SELLAUTH_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SELLAUTH_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || body.error) {
    const message = body.message || "SellAuth request failed.";
    throw new SellAuthRequestError(response.status, message);
  }

  if (body.data !== undefined) {
    return body;
  }

  return {
    ...body,
    data: body as unknown as T,
  };
}

function withPageParams(
  path: string,
  page: number,
  perPage: number,
  extraParams?: Record<string, string>
): string {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("perPage", String(perPage));
  query.set("per_page", String(perPage));

  for (const [key, value] of Object.entries(extraParams || {})) {
    query.set(key, value);
  }

  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${query.toString()}`;
}

function recordKey(value: unknown): string {
  const record = asRecord(value);
  const id = record.id ?? record.product_id ?? record.category_id ?? record.group_id;
  if (id !== null && id !== undefined) {
    return `id:${String(id)}`;
  }

  const name = record.name ?? record.slug ?? record.path;
  if (name !== null && name !== undefined) {
    return `name:${String(name)}`;
  }

  return `raw:${JSON.stringify(value)}`;
}

async function fetchSellAuthCollection(
  path: string,
  keys: string[],
  extraParams?: Record<string, string>
): Promise<unknown[]> {
  const results: unknown[] = [];
  const seenItemKeys = new Set<string>();
  const seenPageSignatures = new Set<string>();

  for (let page = 1; page <= SELLAUTH_MAX_PAGES; page += 1) {
    let response: ApiEnvelope<unknown>;

    try {
      response = await fetchSellAuth<unknown>(
        withPageParams(path, page, SELLAUTH_PAGE_SIZE, extraParams)
      );
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    const pageItems = unwrapCollection(response.data, keys);
    if (pageItems.length === 0) break;

    const signature = pageItems.slice(0, 5).map(recordKey).join("|");
    if (seenPageSignatures.has(signature)) break;
    seenPageSignatures.add(signature);

    let uniqueCountForPage = 0;
    for (const item of pageItems) {
      const key = recordKey(item);
      if (seenItemKeys.has(key)) continue;
      seenItemKeys.add(key);
      uniqueCountForPage += 1;
      results.push(item);
    }

    if (pageItems.length < SELLAUTH_PAGE_SIZE) break;
    if (uniqueCountForPage === 0) break;
  }

  return results;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function decodeRichText(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r/g, "")
    .trim();
}

function splitItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    const output: string[] = [];
    for (const entry of value) {
      output.push(...splitItems(entry));
    }
    return [...new Set(output.map((item) => item.trim()).filter(Boolean))];
  }

  if (typeof value === "object" && value !== null) {
    const record = value as GenericRecord;
    const nested =
      record.items ??
      record.features ??
      record.lines ??
      record.values ??
      record.content ??
      record.description ??
      record.body ??
      record.text ??
      record.value;

    if (nested !== undefined) {
      const nestedItems = splitItems(nested);
      if (nestedItems.length > 0) return nestedItems;
    }

    const kvItems = Object.entries(record)
      .filter(([key]) => !/(title|name|label|tab|id|order)/i.test(key))
      .flatMap(([key, entry]) => {
        const text = splitItems(entry).join(", ");
        if (!text) return [];
        return [`${key.replace(/[_-]+/g, " ")}: ${text}`];
      });

    return [...new Set(kvItems.map((item) => item.trim()).filter(Boolean))];
  }

  const text = decodeRichText(toText(value));
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((line) => line.replace(/^(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return [...new Set(lines)];

  const comma = text
    .split(/[|,]/)
    .map((part) => part.replace(/^(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  return comma.length > 1 ? [...new Set(comma)] : lines;
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseProductTabs(value: unknown): SellAuthProductTab[] {
  const parseAny = (input: unknown): SellAuthProductTab[] => {
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return [];

      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          return parseAny(JSON.parse(trimmed));
        } catch {
          // Not valid JSON, fall through to plain text handling.
        }
      }

      const plainItems = splitItems(trimmed);
      return plainItems.length > 0
        ? [{ title: "Features", items: plainItems.slice(0, 20) }]
        : [];
    }

    if (Array.isArray(input)) {
      const tabs: SellAuthProductTab[] = [];

      input.forEach((entry, index) => {
        if (typeof entry === "string") {
          const items = splitItems(entry);
          if (items.length > 0) {
            tabs.push({ title: `Tab ${index + 1}`, items: items.slice(0, 20) });
          }
          return;
        }

        const record = asRecord(entry);
        if (Object.keys(record).length === 0) return;

        const title =
          asString(record.title) ||
          asString(record.name) ||
          asString(record.label) ||
          asString(record.tab_title) ||
          asString(record.heading) ||
          `Tab ${index + 1}`;

        const items = splitItems(
          record.items ??
            record.features ??
            record.lines ??
            record.values ??
            record.content ??
            record.description ??
            record.body ??
            record.text ??
            record.value
        );

        if (items.length > 0) {
          tabs.push({ title: title.trim(), items: items.slice(0, 20) });
        }
      });

      return tabs;
    }

    if (typeof input === "object" && input !== null) {
      const record = asRecord(input);

      const directTitle =
        asString(record.title) || asString(record.name) || asString(record.label);
      const directItems = splitItems(
        record.items ??
          record.features ??
          record.lines ??
          record.values ??
          record.content ??
          record.description ??
          record.body ??
          record.text ??
          record.value
      );

      if (directTitle && directItems.length > 0) {
        return [{ title: directTitle.trim(), items: directItems.slice(0, 20) }];
      }

      const tabs = Object.entries(record)
        .filter(([key]) => !/(id|order|created|updated|shop|product)/i.test(key))
        .flatMap(([key, raw]) => {
          const items = splitItems(raw);
          if (items.length === 0) return [];
          return [{ title: humanizeKey(key), items: items.slice(0, 20) } satisfies SellAuthProductTab];
        });

      return tabs;
    }

    return [];
  };

  const root = asRecord(value);
  const candidates = [
    root.product_tabs,
    root.productTabs,
    root.tabs,
    root.features,
    root.feature_tabs,
    root.featureTabs,
  ];

  const parsed = candidates.flatMap((candidate) => parseAny(candidate));
  const byTitle = new Map<string, SellAuthProductTab>();

  for (const tab of parsed) {
    const key = toGameSlug(tab.title || "");
    if (!key || tab.items.length === 0) continue;
    if (!byTitle.has(key)) {
      byTitle.set(key, { title: tab.title.trim(), items: [...new Set(tab.items)] });
      continue;
    }

    const existing = byTitle.get(key) as SellAuthProductTab;
    existing.items = [...new Set([...existing.items, ...tab.items])].slice(0, 24);
  }

  return [...byTitle.values()];
}

function parseVariant(rawVariant: unknown): SellAuthVariant | null {
  const variant = asRecord(rawVariant);
  const id = asNumber(variant.id);
  if (id === null) return null;
  return {
    id,
    name: asString(variant.name, "Default"),
    price:
      asNumber(variant.price) ??
      asNumber(variant.sale_price) ??
      asNumber(variant.amount),
    stock: asNumber(variant.stock),
    minQuantity:
      asNumber(variant.min_quantity) ??
      asNumber(variant.minimum_quantity) ??
      asNumber(variant.minimumQuantity) ??
      asNumber(variant.minQuantity) ??
      asNumber(variant.minimum) ??
      asNumber(variant.min),
  };
}

function imageUrlFromImageId(value: unknown): string {
  const id = asNumber(value);
  if (id === null) return "";
  return `${SELLAUTH_BASE_URL.replace(/\/$/, "")}/storage/images/${id}.webp`;
}

function parseGroup(rawGroup: unknown): SellAuthGroup | null {
  const group = asRecord(rawGroup);
  const id = asNumber(group.id);
  if (id === null) return null;

  const imageUrl =
    extractImageCandidate(group.image) ||
    extractImageCandidate(group.image_url) ||
    extractImageCandidate(group.imageUrl) ||
    extractImageCandidate(group.banner) ||
    extractImageCandidate(group.thumbnail) ||
    imageUrlFromImageId(group.image_id) ||
    imageUrlFromImageId(group.imageId);

  return {
    id,
    name: asString(group.name, `Group ${id}`),
    description: asString(group.description, ""),
    image: imageUrl ? { url: imageUrl } : null,
  };
}

function parseCategory(rawCategory: unknown): SellAuthCategory | null {
  const category = asRecord(rawCategory);
  const id = asNumber(category.id);
  if (id === null) return null;

  const imageUrl =
    extractImageCandidate(category.image) ||
    extractImageCandidate(category.image_url) ||
    extractImageCandidate(category.imageUrl) ||
    extractImageCandidate(category.banner) ||
    extractImageCandidate(category.thumbnail) ||
    imageUrlFromImageId(category.image_id) ||
    imageUrlFromImageId(category.imageId);

  return {
    id,
    name: asString(category.name, `Category ${id}`),
    description: asString(category.description, ""),
    image: imageUrl ? { url: imageUrl } : null,
  };
}

function parseProduct(rawProduct: unknown): SellAuthProduct | null {
  const product = asRecord(rawProduct);
  const id = asNumber(product.id);
  if (id === null) return null;

  const groupRecord = asRecord(product.group ?? product.shop_group);
  const categoryRecord = asRecord(product.category ?? product.shop_category);
  const imageRecord = asRecord(product.image);
  const variantsRaw = toArray(product.variants);

  const groupId =
    asNumber(product.group_id) ??
    asNumber(product.groupId) ??
    asNumber(product.shop_group_id) ??
    asNumber(product.shopGroupId) ??
    asNumber(groupRecord.id);
  const categoryId =
    asNumber(product.category_id) ??
    asNumber(product.categoryId) ??
    asNumber(product.shop_category_id) ??
    asNumber(product.shopCategoryId) ??
    asNumber(categoryRecord.id);

  const groupName =
    asString(groupRecord.name) ||
    asString(product.group_name) ||
    asString(product.groupName) ||
    (typeof product.group === "string" ? asString(product.group) : "");
  const categoryName =
    asString(categoryRecord.name) ||
    asString(product.category_name) ||
    asString(product.categoryName) ||
    (typeof product.category === "string" ? asString(product.category) : "");
  const name = asString(product.name, `Product ${id}`);

  const imageCandidates = [
    ...extractImageCandidates(imageRecord),
    ...extractImageCandidates(product.image),
    ...extractImageCandidates(product.images),
    ...extractImageCandidates(product.image_url),
    ...extractImageCandidates(product.imageUrl),
    ...extractImageCandidates(product.thumbnail),
    ...extractImageCandidates(product.thumbnail_url),
    ...extractImageCandidates(product.photo),
    ...extractImageCandidates(product.preview),
    ...extractImageCandidates(product.gallery),
    ...extractImageCandidates(product.media),
    ...extractImageCandidates(product.assets),
    ...extractImageCandidates(variantsRaw),
  ];

  const uniqueImages = [...new Set(imageCandidates)];
  const cachedImage = productImageCache.get(id);
  if (cachedImage && !uniqueImages.includes(cachedImage)) {
    uniqueImages.unshift(cachedImage);
  }

  const image = uniqueImages[0] || PRODUCT_IMAGE_PLACEHOLDER;
  const images = image === PRODUCT_IMAGE_PLACEHOLDER ? [] : uniqueImages;

  const parsedVariants = variantsRaw
    .map(parseVariant)
    .filter((variant): variant is SellAuthVariant => Boolean(variant));
  const parsedTabs = parseProductTabs(product);

  const productMinQuantity =
    asNumber(product.min_quantity) ??
    asNumber(product.minimum_quantity) ??
    asNumber(product.minimumQuantity) ??
    asNumber(product.minQuantity) ??
    asNumber(product.minimum) ??
    asNumber(product.min);

  const variantMinQuantity = parsedVariants.reduce<number | null>((max, variant) => {
    if (typeof variant.minQuantity !== "number" || variant.minQuantity <= 1) return max;
    if (max === null) return variant.minQuantity;
    return variant.minQuantity > max ? variant.minQuantity : max;
  }, null);

  const minQuantity =
    typeof productMinQuantity === "number" && productMinQuantity > 1
      ? productMinQuantity
      : variantMinQuantity;

  const heuristicMinQuantity = /mail/i.test(
    `${name} ${groupName} ${categoryName} ${parsedVariants.map((variant) => variant.name).join(" ")}`
  )
    ? 25
    : null;

  const enforcedMinQuantity =
    typeof minQuantity === "number" && minQuantity > 1
      ? minQuantity
      : heuristicMinQuantity;

  if (image && image !== PRODUCT_IMAGE_PLACEHOLDER) {
    productImageCache.set(id, image);
  }

  return {
    id,
    name,
    description: asString(product.description, ""),
    image,
    images,
    price:
      asNumber(product.price) ??
      asNumber(product.sale_price) ??
      asNumber(product.amount) ??
      (parsedVariants.length > 0 ? parsedVariants[0].price : null),
    currency: asString(product.currency, "USD"),
    stock:
      asNumber(product.stock) ??
      asNumber(product.quantity) ??
      asNumber(product.inventory) ??
      asNumber(product.inventory_count) ??
      asNumber(product.available),
    minQuantity: enforcedMinQuantity,
    groupId,
    groupName,
    categoryId,
    categoryName,
    variants: parsedVariants,
    tabs: parsedTabs,
  };
}

async function fetchProductDetailRecord(productId: number): Promise<GenericRecord | null> {
  const paths = [
    `/v1/shops/${SELLAUTH_SHOP_ID}/products/${productId}`,
    `/v1/shops/${SELLAUTH_SHOP_ID}/product/${productId}`,
    `/v1/products/${productId}`,
  ];

  for (const path of paths) {
    try {
      const response = await fetchSellAuth<unknown>(path);
      const root = asRecord(response.data);
      const candidates = [
        asRecord(root.product),
        asRecord(root.item),
        asRecord(root.data),
        root,
      ];

      const record = candidates.find((candidate) => Object.keys(candidate).length > 0);
      if (record) return record;
    } catch {
      // Try next known path shape.
    }
  }

  return null;
}

function extractDescriptionCandidate(record: GenericRecord): string {
  const candidates = [
    asString(record.description),
    asString(record.long_description),
    asString(record.longDescription),
    asString(record.product_description),
    asString(record.productDescription),
    asString(record.instructions),
    asString(record.content),
  ].map((value) => value.trim());

  return candidates.find((value) => value.length > 0) || "";
}

function buildProductPatchFromDetail(detail: GenericRecord): Partial<SellAuthProduct> {
  const groupRecord = asRecord(detail.group ?? detail.shop_group);
  const categoryRecord = asRecord(detail.category ?? detail.shop_category);

  const patch: Partial<SellAuthProduct> = {};

  const detailImageCandidates = [
    ...extractImageCandidates(detail.image),
    ...extractImageCandidates(detail.image_url),
    ...extractImageCandidates(detail.imageUrl),
    ...extractImageCandidates(detail.thumbnail),
    ...extractImageCandidates(detail.thumbnail_url),
    ...extractImageCandidates(detail.photo),
    ...extractImageCandidates(detail.preview),
    ...extractImageCandidates(detail.gallery),
    ...extractImageCandidates(detail.media),
    ...extractImageCandidates(detail.assets),
    ...extractImageCandidates(detail.images),
    ...extractImageCandidates(detail.variants),
  ];

  const uniqueDetailImages = [...new Set(detailImageCandidates)];
  const detailImage = uniqueDetailImages[0] || "";

  if (detailImage) {
    patch.image = detailImage;
    patch.images = uniqueDetailImages;
  }

  const description = extractDescriptionCandidate(detail);
  if (description) {
    patch.description = description;
  }

  const tabs = parseProductTabs(detail);
  if (tabs.length > 0) {
    patch.tabs = tabs;
  }

  const groupId =
    asNumber(detail.group_id) ??
    asNumber(detail.groupId) ??
    asNumber(detail.shop_group_id) ??
    asNumber(detail.shopGroupId) ??
    asNumber(groupRecord.id);
  const categoryId =
    asNumber(detail.category_id) ??
    asNumber(detail.categoryId) ??
    asNumber(detail.shop_category_id) ??
    asNumber(detail.shopCategoryId) ??
    asNumber(categoryRecord.id);

  const groupName =
    asString(groupRecord.name) ||
    asString(detail.group_name) ||
    asString(detail.groupName) ||
    (typeof detail.group === "string" ? asString(detail.group) : "");
  const categoryName =
    asString(categoryRecord.name) ||
    asString(detail.category_name) ||
    asString(detail.categoryName) ||
    (typeof detail.category === "string" ? asString(detail.category) : "");

  if (groupId !== null) patch.groupId = groupId;
  if (categoryId !== null) patch.categoryId = categoryId;
  if (groupName) patch.groupName = groupName;
  if (categoryName) patch.categoryName = categoryName;

  return patch;
}

async function enrichProductsFromDetails(
  products: SellAuthProduct[]
): Promise<SellAuthProduct[]> {
  if (products.length === 0) return products;

  const patched = products.map((product) => {
    const cached = productDetailCache.get(product.id);
    if (!cached) return product;

    const mergedImages = [...new Set([
      ...(cached.images || []),
      ...(product.images || []),
      cached.image || "",
      product.image || "",
    ].filter((value): value is string => Boolean(value)))];

    return {
      ...product,
      ...cached,
      image: cached.image || product.image,
      images: mergedImages,
      variants: product.variants,
      tabs: cached.tabs || product.tabs || [],
    };
  });

  const targets = patched.filter((product) => {
    const needsImage =
      product.image === PRODUCT_IMAGE_PLACEHOLDER || (product.images || []).length < 2;
    const needsDescription = (product.description || "").trim().length < 8;
    const needsTabs = (product.tabs || []).length === 0;
    const needsCategoryName = !(product.categoryName || "").trim();
    const needsGroupName = !(product.groupName || "").trim();
    return needsImage || needsDescription || needsTabs || needsCategoryName || needsGroupName;
  });

  if (targets.length === 0) return patched;

  const workerCount = 4;
  const queue = [...targets];

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const product = queue.shift();
        if (!product) return;

        const detail = await fetchProductDetailRecord(product.id);
        if (!detail) continue;

        const patch = buildProductPatchFromDetail(detail);
        if (Object.keys(patch).length === 0) continue;

        productDetailCache.set(product.id, patch);
        if (patch.image) productImageCache.set(product.id, patch.image);
      }
    })
  );

  return patched.map((product) => {
    const cached = productDetailCache.get(product.id);
    if (!cached) return product;

    const mergedImages = [...new Set([
      ...(cached.images || []),
      ...(product.images || []),
      cached.image || "",
      product.image || "",
    ].filter((value): value is string => Boolean(value)))];

    return {
      ...product,
      ...cached,
      image: cached.image || product.image,
      images: mergedImages,
      variants: product.variants,
      tabs: cached.tabs || product.tabs || [],
    };
  });
}

function parsePaymentMethod(rawMethod: unknown): SellAuthPaymentMethod | null {
  const method = asRecord(rawMethod);
  const numericId =
    asNumber(method.id) ??
    asNumber(method.payment_method_id) ??
    asNumber(method.paymentMethodId);
  const id =
    (numericId !== null ? String(Math.trunc(numericId)) : "") ||
    asString(method.id) ||
    asString(method.payment_method_id) ||
    asString(method.paymentMethodId) ||
    asString(method.type) ||
    asString(method.gateway) ||
    asString(method.key) ||
    asString(method.name);
  if (!id) return null;

  const name =
    asString(method.display_name) ||
    asString(method.displayName) ||
    asString(method.label) ||
    asString(method.gateway) ||
    asString(method.name) ||
    id;
  const enabledValue =
    method.enabled ??
    method.active ??
    method.is_active ??
    method.isActive ??
    method.is_enabled ??
    method.isEnabled;
  const enabled =
    typeof enabledValue === "boolean"
      ? enabledValue
      : typeof enabledValue === "number"
        ? enabledValue > 0
        : typeof enabledValue === "string"
          ? enabledValue === "1" || enabledValue.toLowerCase() === "true"
        : true;

  return {
    id: id.trim(),
    name,
    enabled,
  };
}

function syntheticIdFromName(name: string, base: number): number {
  const slug = toGameSlug(name) || "unknown";
  let hash = 0;
  for (const ch of slug) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  }
  return base + hash;
}

function ensureGroupsFromProducts(products: SellAuthProduct[]): SellAuthGroup[] {
  const map = new Map<number, SellAuthGroup>();
  for (const product of products) {
    const name = product.groupName || product.categoryName || product.name;
    const id = product.groupId ?? (name ? syntheticIdFromName(name, 700000) : null);
    if (!id || map.has(id)) continue;

    map.set(id, {
      id,
      name: name || `Group ${id}`,
      description: "",
      image: { url: fallbackGameImage(name || product.name) },
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function ensureCategoriesFromProducts(
  products: SellAuthProduct[]
): SellAuthCategory[] {
  const map = new Map<number, SellAuthCategory>();
  for (const product of products) {
    const name = product.categoryName || product.groupName || product.name;
    const id = product.categoryId ?? (name ? syntheticIdFromName(name, 800000) : null);
    if (!id || map.has(id)) continue;

    map.set(id, {
      id,
      name: name || `Category ${id}`,
      description: "",
      image: { url: fallbackGameImage(name || product.name) },
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeBySlug<T extends { name: string }>(
  liveItems: T[],
  baselineItems: T[]
): T[] {
  const outputBySlug = new Map<string, T>();

  const score = (item: T): number => {
    const anyItem = item as unknown as { image?: { url?: string | null } | null };
    return anyItem?.image?.url ? 2 : 1;
  };

  for (const item of liveItems) {
    const slug = canonicalCategorySlug(item.name);
    if (!slug) continue;

    const existing = outputBySlug.get(slug);
    if (!existing) {
      outputBySlug.set(slug, item);
      continue;
    }

    if (score(item) > score(existing)) {
      outputBySlug.set(slug, item);
    }
  }

  for (const item of baselineItems) {
    const slug = canonicalCategorySlug(item.name);
    if (!slug) continue;
    if (!outputBySlug.has(slug)) {
      outputBySlug.set(slug, item);
    }
  }

  return [...outputBySlug.values()];
}

export async function getStorefrontData(): Promise<StorefrontData> {
  if (!isSellAuthConfigured()) {
    return {
      ...mockStorefrontData,
      fetchedAt: new Date().toISOString(),
    };
  }

  const cached = getCachedStorefront();
  if (cached) {
    return cached;
  }

  const warnings: string[] = [];

  try {
    const [productsResult, groupsResult, categoriesResult, methodsResult] =
      await Promise.allSettled([
        fetchSellAuthCollection(
          `/v1/shops/${SELLAUTH_SHOP_ID}/products`,
          ["products", "items", "data"],
          { all: "1" }
        ),
        fetchSellAuthCollection(`/v1/shops/${SELLAUTH_SHOP_ID}/groups`, [
          "groups",
          "items",
          "data",
        ]),
        fetchSellAuthCollection(`/v1/shops/${SELLAUTH_SHOP_ID}/categories`, [
          "categories",
          "items",
          "data",
        ]),
        fetchSellAuthCollection(`/v1/shops/${SELLAUTH_SHOP_ID}/payment-methods`, [
          "payment_methods",
          "paymentMethods",
          "methods",
          "items",
          "data",
        ]),
      ]);

    if (productsResult.status !== "fulfilled") {
      throw new Error(productsResult.reason?.message || "Failed to fetch products");
    }

    const products = productsResult.value
      .map(parseProduct)
      .filter((item): item is SellAuthProduct => Boolean(item));

    if (products.length === 0) {
      warnings.push("SellAuth returned zero products.");
    }

    const groupsFromSellAuth =
      groupsResult.status === "fulfilled"
        ? groupsResult.value
            .map(parseGroup)
            .filter((item): item is SellAuthGroup => Boolean(item))
        : [];

    const categoriesFromSellAuth =
      categoriesResult.status === "fulfilled"
        ? categoriesResult.value
            .map(parseCategory)
            .filter((item): item is SellAuthCategory => Boolean(item))
        : [];

    const paymentMethods =
      methodsResult.status === "fulfilled"
        ? methodsResult.value
            .map(parsePaymentMethod)
            .filter(
              (item): item is SellAuthPaymentMethod => Boolean(item && item.enabled)
            )
        : [];

    const baselineBanners = getLocalCategoryBanners(14);
    const baselineGroups = bannersToGroups(baselineBanners);
    const baselineCategories = bannersToCategories(baselineBanners);

    const baselineImageBySlug = new Map(
      baselineBanners.map((banner) => [canonicalCategorySlug(banner.name), banner.imageUrl])
    );

    const groupsClean = groupsFromSellAuth.map((group) => {
      const slug = canonicalCategorySlug(group.name);
      const baselineImage = baselineImageBySlug.get(slug);
      if (baselineImage) return { ...group, image: { url: baselineImage } };
      return group;
    });

    const categoriesClean = categoriesFromSellAuth.map((category) => {
      const slug = canonicalCategorySlug(category.name);
      const baselineImage = baselineImageBySlug.get(slug);
      if (baselineImage) return { ...category, image: { url: baselineImage } };
      return category;
    });

    const groupById = new Map(groupsClean.map((group) => [group.id, group] as const));
    const categoryById = new Map(
      categoriesClean.map((category) => [category.id, category] as const)
    );

    const productsResolved = products.map((product) => {
      let groupName = product.groupName.trim();
      let categoryName = product.categoryName.trim();

      const groupSlug = canonicalCategorySlug(groupName);
      const categorySlug = canonicalCategorySlug(categoryName);
      if (groupSlug && groupSlug !== toGameSlug(groupName)) {
        groupName = labelForCategorySlug(groupSlug);
      }
      if (categorySlug && categorySlug !== toGameSlug(categoryName)) {
        categoryName = labelForCategorySlug(categorySlug);
      }

      if (!groupName && product.groupId !== null) {
        groupName = groupById.get(product.groupId)?.name || "";
      }

      if (!categoryName && product.categoryId !== null) {
        categoryName = categoryById.get(product.categoryId)?.name || "";
      }

      if (!groupName && categoryName) {
        const categorySlug = canonicalCategorySlug(categoryName);
        groupName =
          groupsClean.find((group) => canonicalCategorySlug(group.name) === categorySlug)?.name ||
          labelForCategorySlug(categorySlug);
      }

      if (!categoryName && groupName) {
        const groupSlug = canonicalCategorySlug(groupName);
        categoryName =
          categoriesClean.find(
            (category) => canonicalCategorySlug(category.name) === groupSlug
          )?.name || labelForCategorySlug(groupSlug);
      }

      if (!groupName || !categoryName) {
        const inferred = inferCategoryNameFromProduct(product);
        if (inferred) {
          if (!groupName) groupName = inferred;
          if (!categoryName) categoryName = inferred;
        }
      }

      if (!groupName && categoryName) groupName = categoryName;
      if (!categoryName && groupName) categoryName = groupName;

      return {
        ...product,
        groupName,
        categoryName,
      };
    });

    const productsClean = productsResolved.map((product) => {
      const slug = canonicalCategorySlug(product.groupName || product.categoryName || "");
      const baselineImage = baselineImageBySlug.get(slug);
      if (baselineImage && (!product.image || product.image.startsWith("/games/"))) {
        return { ...product, image: baselineImage };
      }
      return product;
    });

    const productsFinal = await enrichProductsFromDetails(productsClean);

    const productDerivedGroups = ensureGroupsFromProducts(productsFinal);
    const productDerivedCategories = ensureCategoriesFromProducts(productsFinal);

    const categoryGroups: SellAuthGroup[] = categoriesClean.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description || `${category.name} category`,
      image: category.image,
    }));

    const productCountBySlug = new Map<string, number>();
    for (const product of productsFinal) {
      const groupSlug = canonicalCategorySlug(product.groupName || "");
      const categorySlug = canonicalCategorySlug(product.categoryName || "");
      if (groupSlug) {
        productCountBySlug.set(groupSlug, (productCountBySlug.get(groupSlug) || 0) + 1);
      }
      if (categorySlug) {
        productCountBySlug.set(categorySlug, (productCountBySlug.get(categorySlug) || 0) + 1);
      }
    }

    const combinedGroups = [...groupsClean, ...categoryGroups, ...productDerivedGroups];
    const bestGroupBySlug = new Map<string, SellAuthGroup>();
    for (const group of combinedGroups) {
      const slug = canonicalCategorySlug(group.name);
      if (!slug) continue;

      const existing = bestGroupBySlug.get(slug);
      if (!existing) {
        bestGroupBySlug.set(slug, group);
        continue;
      }

      const currentHasProducts = (productCountBySlug.get(slug) || 0) > 0;
      const existingHasImage = Boolean(existing.image?.url);
      const currentHasImage = Boolean(group.image?.url);

      if (currentHasProducts && !existingHasImage && currentHasImage) {
        bestGroupBySlug.set(slug, group);
        continue;
      }

      if (!existingHasImage && currentHasImage) {
        bestGroupBySlug.set(slug, group);
      }
    }

    const mergedGroups = mergeBySlug([...bestGroupBySlug.values()], baselineGroups);
    const mergedCategories = mergeBySlug(
      [...categoriesClean, ...productDerivedCategories],
      baselineCategories
    );

    if (groupsResult.status !== "fulfilled") {
      warnings.push("Could not fetch groups from SellAuth.");
    }
    if (categoriesResult.status !== "fulfilled") {
      warnings.push("Could not fetch categories from SellAuth.");
    }
    if (methodsResult.status !== "fulfilled") {
      warnings.push("Could not fetch payment methods from SellAuth.");
    } else if (paymentMethods.length === 0) {
      warnings.push(
        "SellAuth returned zero enabled payment methods. Configure at least one payment method in your SellAuth dashboard."
      );
    }
    if (groupsFromSellAuth.length === 0 && categoriesFromSellAuth.length === 0) {
      warnings.push(
        "SellAuth groups/categories are empty. Showing default category banners plus live products."
      );
    }

    const result: StorefrontData = {
      success: true,
      provider: "sellauth",
      message: "Live data loaded from SellAuth dashboard.",
      products: productsFinal,
      groups:
        mergedGroups.length > 0
          ? mergedGroups
          : ensureGroupsFromProducts(productsFinal),
      categories:
        mergedCategories.length > 0
          ? mergedCategories
          : ensureCategoriesFromProducts(productsFinal),
      paymentMethods,
      warnings,
      fetchedAt: new Date().toISOString(),
    };

    setCachedStorefront(result);
    return result;
  } catch (error) {
    if (storefrontCache) {
      const stale = cloneStorefront(storefrontCache.data);
      return {
        ...stale,
        message:
          error instanceof Error
            ? `SellAuth temporarily failed: ${error.message}`
            : "SellAuth request failed.",
        warnings: [
          "Using last known live storefront data while SellAuth is rate-limited.",
          ...(error instanceof Error ? [error.message] : []),
        ],
        fetchedAt: stale.fetchedAt,
      };
    }

    return {
      ...mockStorefrontData,
      message:
        error instanceof Error
          ? `SellAuth failed: ${error.message}`
          : "SellAuth request failed.",
      warnings: [
        "SellAuth API failed, showing demo mode catalog.",
        ...(error instanceof Error ? [error.message] : []),
      ],
      fetchedAt: new Date().toISOString(),
    };
  }
}

function looksLikeCheckoutUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function parseCheckoutUrl(rawData: unknown): string | null {
  const queue: unknown[] = [rawData];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    if (typeof current === "string") {
      const value = current.trim();
      if (looksLikeCheckoutUrl(value)) return value;
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current !== "object") continue;

    const record = current as GenericRecord;
    const directCandidates = [
      asString(record.url),
      asString(record.checkout_url),
      asString(record.checkoutUrl),
      asString(record.checkout_link),
      asString(record.checkoutLink),
      asString(record.payment_url),
      asString(record.paymentUrl),
      asString(record.payment_link),
      asString(record.paymentLink),
      asString(record.invoice_url),
      asString(record.invoiceUrl),
      asString(record.hosted_url),
      asString(record.hostedUrl),
      asString(record.link),
      asString(record.redirect_url),
      asString(record.redirectUrl),
      asString(asRecord(record.invoice).url),
      asString(asRecord(record.invoice).checkout_url),
      asString(asRecord(record.invoice).checkoutUrl),
      asString(asRecord(record.data).url),
    ].filter(Boolean);

    const matched = directCandidates.find(looksLikeCheckoutUrl);
    if (matched) return matched;

    for (const value of Object.values(record)) {
      queue.push(value);
    }
  }

  return null;
}

export async function createSellAuthCheckout(input: CheckoutRequestInput): Promise<{
  redirectUrl: string | null;
  raw: unknown;
}> {
  if (!isSellAuthConfigured()) {
    throw new Error(
      "SellAuth is not configured. Set SELLAUTH_SHOP_ID and SELLAUTH_API_KEY."
    );
  }

  const paymentMethod = input.paymentMethod.trim();
  const paymentMethodId = asNumber(paymentMethod);
  const checkoutItems = input.items.map((item) => ({
    productId: item.productId,
    product_id: item.productId,
    quantity: item.quantity,
    ...(item.variantId ? { variantId: item.variantId, variant_id: item.variantId } : {}),
  }));

  const payload: GenericRecord = {
    cart: checkoutItems,
    items: checkoutItems,
    ...(input.email ? { customer_email: input.email } : {}),
    ...(input.couponCode ? { coupon_code: input.couponCode } : {}),
  };
  if (
    paymentMethod &&
    paymentMethodId !== null &&
    Number.isInteger(paymentMethodId) &&
    paymentMethodId > 0
  ) {
    payload.payment_method_id = paymentMethodId;
  } else if (paymentMethod) {
    payload.gateway = paymentMethod;
  }

  const response = await fetchSellAuth<unknown>(
    `/v1/shops/${SELLAUTH_SHOP_ID}/checkout`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const redirectUrl = parseCheckoutUrl(response.data) || parseCheckoutUrl(response);

  return {
    redirectUrl,
    raw: response.data ?? response,
  };
}
