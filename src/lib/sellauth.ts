import { mockStorefrontData } from "@/lib/mock-data";
import {
  aliasTokensForLabel,
  bannersToCategories,
  bannersToGroups,
  createExampleProductsForBanner,
  getLocalCategoryBanners,
  normalizeAliasToken,
  type LocalCategoryBanner,
} from "@/lib/local-banners";
import { toGameSlug } from "@/lib/game-slug";
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

function isSellAuthConfigured(): boolean {
  return Boolean(SELLAUTH_SHOP_ID && SELLAUTH_API_KEY);
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
  return body;
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
  };
}

function parseGroup(rawGroup: unknown): SellAuthGroup | null {
  const group = asRecord(rawGroup);
  const id = asNumber(group.id);
  if (id === null) return null;

  const imageValue = group.image;
  const imageRecord = asRecord(imageValue);
  const imageUrl =
    asString(imageRecord.url) ||
    asString(imageRecord.src) ||
    asString(imageValue) ||
    fallbackGameImage(asString(group.name));

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

  const imageValue = category.image;
  const imageRecord = asRecord(imageValue);
  const imageUrl =
    asString(imageRecord.url) || asString(imageRecord.src) || asString(imageValue);

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

  const groupId =
    asNumber(product.group_id) ??
    asNumber(product.shop_group_id) ??
    asNumber(groupRecord.id);
  const categoryId =
    asNumber(product.category_id) ??
    asNumber(product.shop_category_id) ??
    asNumber(categoryRecord.id);

  const groupName = asString(groupRecord.name);
  const categoryName = asString(categoryRecord.name);
  const name = asString(product.name, `Product ${id}`);
  const image =
    asString(imageRecord.url) ||
    asString(imageRecord.src) ||
    asString(product.image) ||
    fallbackGameImage(groupName || name);

  const parsedVariants = toArray(product.variants)
    .map(parseVariant)
    .filter((variant): variant is SellAuthVariant => Boolean(variant));

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
    stock: asNumber(product.stock),
    groupId,
    groupName,
    categoryId,
    categoryName,
    variants: parsedVariants,
  };
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

function ensureGroupsFromProducts(products: SellAuthProduct[]): SellAuthGroup[] {
  const map = new Map<number, SellAuthGroup>();
  for (const product of products) {
    if (!product.groupId || map.has(product.groupId)) continue;
    map.set(product.groupId, {
      id: product.groupId,
      name: product.groupName || `Group ${product.groupId}`,
      description: "",
      image: { url: fallbackGameImage(product.groupName || product.name) },
    });
  }
  return [...map.values()];
}

function ensureCategoriesFromProducts(
  products: SellAuthProduct[]
): SellAuthCategory[] {
  const map = new Map<number, SellAuthCategory>();
  for (const product of products) {
    if (!product.categoryId || map.has(product.categoryId)) continue;
    map.set(product.categoryId, {
      id: product.categoryId,
      name: product.categoryName || `Category ${product.categoryId}`,
      description: "",
      image: null,
    });
  }
  return [...map.values()];
}

function findBannerForProduct(
  product: SellAuthProduct,
  banners: LocalCategoryBanner[],
  aliasToBanner: Map<string, LocalCategoryBanner>
): LocalCategoryBanner | null {
  if (banners.length === 0) return null;

  const slugCandidates = [
    toGameSlug(product.groupName || ""),
    toGameSlug(product.categoryName || ""),
    product.groupName || "",
    product.categoryName || "",
  ].filter(Boolean);

  for (const candidate of slugCandidates) {
    const token = normalizeAliasToken(candidate);
    if (!token) continue;
    const exact = aliasToBanner.get(token);
    if (exact) return exact;
  }

  const textTokens = `${product.name} ${product.description} ${product.groupName} ${product.categoryName}`
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean);

  for (let index = 0; index < textTokens.length; index += 1) {
    const single = normalizeAliasToken(textTokens[index]);
    if (single && aliasToBanner.has(single)) {
      return aliasToBanner.get(single) || null;
    }

    const pairRaw = `${textTokens[index]}${textTokens[index + 1] || ""}`;
    const pair = normalizeAliasToken(pairRaw);
    if (pair && aliasToBanner.has(pair)) {
      return aliasToBanner.get(pair) || null;
    }

    const triRaw = `${textTokens[index]}${textTokens[index + 1] || ""}${textTokens[index + 2] || ""}`;
    const tri = normalizeAliasToken(triRaw);
    if (tri && aliasToBanner.has(tri)) {
      return aliasToBanner.get(tri) || null;
    }
  }

  const hashSeed = Math.abs((product.id || 0) + product.name.length);
  return banners[hashSeed % banners.length];
}

function buildBannerAliasIndex(
  banners: LocalCategoryBanner[]
): Map<string, LocalCategoryBanner> {
  const map = new Map<string, LocalCategoryBanner>();

  for (const banner of banners) {
    const tokens = new Set<string>([
      ...aliasTokensForLabel(banner.name),
      normalizeAliasToken(banner.slug),
      normalizeAliasToken(banner.name),
    ]);

    tokens.forEach((token) => {
      if (!token || map.has(token)) return;
      map.set(token, banner);
    });
  }

  return map;
}

function assignProductsToBanners(
  products: SellAuthProduct[],
  banners: LocalCategoryBanner[]
): SellAuthProduct[] {
  if (banners.length === 0) return products;
  const aliasToBanner = buildBannerAliasIndex(banners);

  return products.map((product) => {
    const banner = findBannerForProduct(product, banners, aliasToBanner);
    if (!banner) return product;

    const shouldReplaceImage = !product.image || product.image.startsWith("/games/");

    return {
      ...product,
      image: shouldReplaceImage ? banner.imageUrl : product.image,
      groupId: banner.groupId,
      groupName: banner.name,
      categoryId: banner.categoryId,
      categoryName: banner.name,
    };
  });
}

function ensureExampleProductsPerBanner(
  products: SellAuthProduct[],
  banners: LocalCategoryBanner[],
  minimumPerBanner = 3
): SellAuthProduct[] {
  if (banners.length === 0) return products;

  const output = [...products];
  const usedIds = new Set(output.map((product) => product.id));

  for (let index = 0; index < banners.length; index += 1) {
    const banner = banners[index];
    let count = output.filter(
      (product) => product.categoryId === banner.categoryId
    ).length;

    if (count >= minimumPerBanner) continue;

    const examples = createExampleProductsForBanner(banner, index);
    for (const sample of examples) {
      if (count >= minimumPerBanner) break;

      let nextId = sample.id;
      while (usedIds.has(nextId)) {
        nextId += 1000000;
      }

      output.push({ ...sample, id: nextId });
      usedIds.add(nextId);
      count += 1;
    }
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

    const localBanners = getLocalCategoryBanners(14);
    const localGroups = bannersToGroups(localBanners);
    const localCategories = bannersToCategories(localBanners);
    const hasPdBannerImages = localBanners.some((banner) =>
      banner.imageUrl.startsWith("/pd.png/") || banner.imageUrl.startsWith("/pd/")
    );

    const productsAssigned = assignProductsToBanners(products, localBanners);
    const productsWithExamples = ensureExampleProductsPerBanner(
      productsAssigned,
      localBanners,
      3
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
    if (localBanners.length < 14) {
      warnings.push(
        "Fewer than 14 banner images found. Added fallback categories to keep 14 visible categories."
      );
    }
    if (!hasPdBannerImages) {
      warnings.push(
        "No banner files found in public/pd.png, public/pd, pd.png, or pd. Using fallback images."
      );
    }
    if (groupsFromSellAuth.length === 0 && categoriesFromSellAuth.length === 0) {
      warnings.push(
        "SellAuth groups/categories are empty. Applied local pd.png categories for storefront navigation."
      );
    }

    return {
      success: true,
      provider: "sellauth",
      message: "Live data loaded from SellAuth dashboard.",
      products: productsWithExamples,
      groups:
        localGroups.length > 0
          ? localGroups
          : groupsFromSellAuth.length > 0
            ? groupsFromSellAuth
            : ensureGroupsFromProducts(productsWithExamples),
      categories:
        localCategories.length > 0
          ? localCategories
          : categoriesFromSellAuth.length > 0
            ? categoriesFromSellAuth
            : ensureCategoriesFromProducts(productsWithExamples),
      paymentMethods,
      warnings,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
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

function parseCheckoutUrl(rawData: unknown): string | null {
  const data = asRecord(rawData);
  const urlCandidates = [
    asString(data.url),
    asString(data.checkout_url),
    asString(data.checkoutUrl),
    asString(data.payment_url),
    asString(data.paymentUrl),
    asString(asRecord(data.invoice).url),
  ].filter(Boolean);

  return urlCandidates[0] || null;
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
  const payload: GenericRecord = {
    cart: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      ...(item.variantId ? { variantId: item.variantId } : {}),
    })),
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

  return {
    redirectUrl: parseCheckoutUrl(response.data),
    raw: response.data,
  };
}
