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

const SELLAUTH_BASE_URL =
  process.env.SELLAUTH_API_BASE_URL?.trim() || "https://api.sellauth.com";
const SELLAUTH_SHOP_ID = process.env.SELLAUTH_SHOP_ID?.trim() || "";
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY?.trim() || "";
const PRODUCT_IMAGE_PLACEHOLDER = "/placeholders/product-image-not-added.svg";
const STOREFRONT_CACHE_TTL_MS = 25_000;

let storefrontCache:
  | {
      data: StorefrontData;
      expiresAt: number;
    }
  | null = null;

const productImageCache = new Map<number, string>();

function isSellAuthConfigured(): boolean {
  return Boolean(SELLAUTH_SHOP_ID && SELLAUTH_API_KEY);
}

function cloneStorefront(data: StorefrontData): StorefrontData {
  return {
    ...data,
    products: data.products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({ ...variant })),
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

function extractImageCandidate(value: unknown, depth = 0): string {
  if (depth > 3 || value === null || value === undefined) return "";

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
  const preferredKeys = [
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

  for (const key of preferredKeys) {
    const found = extractImageCandidate(record[key], depth + 1);
    if (found) return found;
  }

  return "";
}

const CANONICAL_CATEGORY_ALIASES: Record<string, string> = {
  "apex-legends": "apex",
  apexlegends: "apex",
  cs2: "counter-strike-2",
  counterstrike2: "counter-strike-2",
  "counter-strike2": "counter-strike-2",
  r6: "rainbow-six-siege",
  "r6-siege": "rainbow-six-siege",
  rainbowsixsiege: "rainbow-six-siege",
  callofduty: "call-of-duty",
  cod: "call-of-duty",
  lol: "league-of-legends",
  leagueoflegends: "league-of-legends",
  arcraiders: "arc-raiders",
};

function canonicalCategorySlug(name: string): string {
  const slug = toGameSlug(name);
  if (!slug) return "";
  const compact = slug.replace(/-/g, "");
  return CANONICAL_CATEGORY_ALIASES[slug] || CANONICAL_CATEGORY_ALIASES[compact] || slug;
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

function parseGroup(rawGroup: unknown): SellAuthGroup | null {
  const group = asRecord(rawGroup);
  const id = asNumber(group.id);
  if (id === null) return null;

  const imageUrl =
    extractImageCandidate(group.image) ||
    extractImageCandidate(group.image_url) ||
    extractImageCandidate(group.imageUrl) ||
    extractImageCandidate(group.banner) ||
    extractImageCandidate(group.thumbnail);

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
    extractImageCandidate(category.thumbnail);

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

  const image =
    extractImageCandidate(imageRecord) ||
    extractImageCandidate(product.image) ||
    extractImageCandidate(product.image_url) ||
    extractImageCandidate(product.imageUrl) ||
    extractImageCandidate(product.thumbnail) ||
    extractImageCandidate(product.thumbnail_url) ||
    extractImageCandidate(product.photo) ||
    extractImageCandidate(product.preview) ||
    extractImageCandidate(product.gallery) ||
    extractImageCandidate(variantsRaw) ||
    productImageCache.get(id) ||
    PRODUCT_IMAGE_PLACEHOLDER;

  const parsedVariants = variantsRaw
    .map(parseVariant)
    .filter((variant): variant is SellAuthVariant => Boolean(variant));

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

async function enrichMissingProductImages(
  products: SellAuthProduct[]
): Promise<SellAuthProduct[]> {
  const missing = products.filter((product) => product.image === PRODUCT_IMAGE_PLACEHOLDER);
  if (missing.length === 0) return products;

  const map = new Map<number, string>();

  // Pull from in-memory cache first.
  for (const product of missing) {
    const cached = productImageCache.get(product.id);
    if (cached) {
      map.set(product.id, cached);
    }
  }

  // Enrich only a few uncached items per request to avoid SellAuth rate limits.
  const uncachedMissing = missing
    .filter((product) => !map.has(product.id))
    .slice(0, 6);

  await Promise.all(
    uncachedMissing.map(async (product) => {
      const detail = await fetchProductDetailRecord(product.id);
      if (!detail) return;

      const detailImage =
        extractImageCandidate(detail.image) ||
        extractImageCandidate(detail.image_url) ||
        extractImageCandidate(detail.imageUrl) ||
        extractImageCandidate(detail.thumbnail) ||
        extractImageCandidate(detail.thumbnail_url) ||
        extractImageCandidate(detail.photo) ||
        extractImageCandidate(detail.preview) ||
        extractImageCandidate(detail.gallery) ||
        extractImageCandidate(detail.media) ||
        extractImageCandidate(detail.assets) ||
        extractImageCandidate(detail.variants);

      if (detailImage) {
        map.set(product.id, detailImage);
        productImageCache.set(product.id, detailImage);
      }
    })
  );

  if (map.size === 0) return products;
  return products.map((product) =>
    map.has(product.id) ? { ...product, image: map.get(product.id) as string } : product
  );
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
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of liveItems) {
    const slug = canonicalCategorySlug(item.name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    output.push(item);
  }

  for (const item of baselineItems) {
    const slug = canonicalCategorySlug(item.name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    output.push(item);
  }

  return output;
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
        fetchSellAuth<unknown[]>(`/v1/shops/${SELLAUTH_SHOP_ID}/products`),
        fetchSellAuth<unknown[]>(`/v1/shops/${SELLAUTH_SHOP_ID}/groups`),
        fetchSellAuth<unknown[]>(`/v1/shops/${SELLAUTH_SHOP_ID}/categories`),
        fetchSellAuth<unknown[]>(`/v1/shops/${SELLAUTH_SHOP_ID}/payment-methods`),
      ]);

    if (productsResult.status !== "fulfilled") {
      throw new Error(productsResult.reason?.message || "Failed to fetch products");
    }

    const products = unwrapCollection(productsResult.value.data, [
      "products",
      "items",
      "data",
    ])
      .map(parseProduct)
      .filter((item): item is SellAuthProduct => Boolean(item));

    if (products.length === 0) {
      warnings.push("SellAuth returned zero products.");
    }

    const groupsFromSellAuth =
      groupsResult.status === "fulfilled"
        ? unwrapCollection(groupsResult.value.data, ["groups", "items", "data"])
            .map(parseGroup)
            .filter((item): item is SellAuthGroup => Boolean(item))
        : [];

    const categoriesFromSellAuth =
      categoriesResult.status === "fulfilled"
        ? unwrapCollection(categoriesResult.value.data, [
            "categories",
            "items",
            "data",
          ])
            .map(parseCategory)
            .filter((item): item is SellAuthCategory => Boolean(item))
        : [];

    const paymentMethods =
      methodsResult.status === "fulfilled"
        ? unwrapCollection(methodsResult.value.data, [
            "payment_methods",
            "paymentMethods",
            "methods",
            "items",
            "data",
          ])
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

    const accountsMiscVpnFallbackBySlug = new Map<string, string>([
      ["accounts", "/pd/accounts.svg"],
      ["misc", "/pd/misc.svg"],
      ["vpns", "/pd/vpns.svg"],
      ["vpn", "/pd/vpns.svg"],
    ]);

    const groupsClean = groupsFromSellAuth.map((group) => {
      const slug = canonicalCategorySlug(group.name);
      const baselineImage = baselineImageBySlug.get(slug);
      const fallbackImage = accountsMiscVpnFallbackBySlug.get(slug);

      if (baselineImage) return { ...group, image: { url: baselineImage } };
      if (!group.image && fallbackImage) return { ...group, image: { url: fallbackImage } };
      return group;
    });

    const categoriesClean = categoriesFromSellAuth.map((category) => {
      const slug = canonicalCategorySlug(category.name);
      const baselineImage = baselineImageBySlug.get(slug);
      const fallbackImage = accountsMiscVpnFallbackBySlug.get(slug);

      if (baselineImage) return { ...category, image: { url: baselineImage } };
      if (!category.image && fallbackImage) return { ...category, image: { url: fallbackImage } };
      return category;
    });

    const productsClean = products.map((product) => {
      const slug = canonicalCategorySlug(product.groupName || product.categoryName || "");
      const baselineImage = baselineImageBySlug.get(slug);
      const fallbackImage = accountsMiscVpnFallbackBySlug.get(slug);

      if (baselineImage && (!product.image || product.image.startsWith("/games/"))) {
        return { ...product, image: baselineImage };
      }

      if (product.image === PRODUCT_IMAGE_PLACEHOLDER && fallbackImage) {
        return { ...product, image: fallbackImage };
      }

      return product;
    });

    const productsFinal = await enrichMissingProductImages(productsClean);

    const categoryGroups: SellAuthGroup[] = categoriesClean.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description || `${category.name} category`,
      image: category.image,
    }));

    const mergedGroups = mergeBySlug([...groupsClean, ...categoryGroups], baselineGroups);
    const mergedCategories = mergeBySlug(categoriesClean, baselineCategories);

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
