import { canonicalGameSlug } from "@/lib/game-slug";
import { CATEGORY_IMAGES, CATEGORY_TILES } from "@/lib/category-images";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";

const PLACEHOLDER = "/placeholders/category-banner-not-added.svg";

export interface CategoryTile {
  slug: string;
  name: string;
  image: string;
  /** Lowest price across every product in the category, or null if unpriced. */
  lowestPrice: number | null;
  /** True when the tile came from SellAuth without curated local art. */
  usesRemoteImage: boolean;
}

/**
 * Canonical slug for a storefront group name.
 *
 * Wraps canonicalGameSlug with the Call of Duty special-casing SellAuth needs:
 * COD products come through with group names like "B07 WZ External" rather than
 * anything containing "call of duty".
 */
export function canonicalGroupSlug(value: string): string {
  const raw = value || "";
  if (/^\s*(?:b0?7\s*)?(?:wz\s*)?(?:internal|external)\s*$/i.test(raw)) {
    return "call-of-duty";
  }

  const slug = canonicalGameSlug(raw);
  const compact = slug.replace(/-/g, "");
  if (
    compact === "b07" ||
    compact === "wz" ||
    compact === "wzexternal" ||
    compact === "wzinternal" ||
    compact === "b07wzexternal" ||
    compact === "b07wzinternal"
  ) {
    return "call-of-duty";
  }

  return slug;
}

function productLowestPrice(product: SellAuthProduct): number | null {
  const prices: number[] = [];
  if (typeof product.price === "number") prices.push(product.price);
  for (const variant of product.variants) {
    if (typeof variant.price === "number") prices.push(variant.price);
  }
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/** Curated display names + ordering, keyed by canonical slug. */
const CURATED_NAME = new Map(CATEGORY_TILES.map((t) => [t.slug, t.name]));
const CURATED_ORDER = CATEGORY_TILES.map((t) => t.slug);

/**
 * Build the "Shop by Game" tiles from live storefront data.
 *
 * Tiles are derived from what SellAuth actually returns, so adding a category
 * there makes it appear on the site with no code change. Curated games keep
 * their hand-picked local artwork and ordering; anything new falls back to its
 * SellAuth image and is appended after the curated set, alphabetically.
 *
 * A category needs at least one product to appear — an empty tile would link
 * to an empty page.
 */
export function buildCategoryTiles(data: StorefrontData | null): CategoryTile[] {
  if (!data) return [];

  // Group every product under its canonical slug.
  const buckets = new Map<string, { name: string; products: SellAuthProduct[] }>();
  for (const product of data.products || []) {
    const rawName = (product.groupName || product.categoryName || "").trim();
    const slug = canonicalGroupSlug(rawName);
    if (!slug) continue;

    const existing = buckets.get(slug);
    if (existing) {
      existing.products.push(product);
    } else {
      buckets.set(slug, { name: rawName, products: [product] });
    }
  }

  // SellAuth group images, keyed by the same canonical slug, for categories we
  // have no curated local artwork for.
  const remoteImages = new Map<string, string>();
  for (const group of data.groups || []) {
    const slug = canonicalGroupSlug(group.name || "");
    const url = group.image?.url;
    if (slug && url && !remoteImages.has(slug)) remoteImages.set(slug, url);
  }
  for (const category of data.categories || []) {
    const slug = canonicalGroupSlug(category.name || "");
    const url = category.image?.url;
    if (slug && url && !remoteImages.has(slug)) remoteImages.set(slug, url);
  }

  const tiles: CategoryTile[] = [];
  for (const [slug, bucket] of buckets) {
    const localImage = CATEGORY_IMAGES[slug];
    const remoteImage = remoteImages.get(slug);
    const productImage = bucket.products.find((p) => p.image)?.image;
    const image = localImage || remoteImage || productImage || PLACEHOLDER;

    let lowestPrice: number | null = null;
    for (const product of bucket.products) {
      const price = productLowestPrice(product);
      if (price === null) continue;
      if (lowestPrice === null || price < lowestPrice) lowestPrice = price;
    }

    tiles.push({
      slug,
      name: CURATED_NAME.get(slug) || bucket.name,
      image,
      lowestPrice,
      usesRemoteImage: !localImage,
    });
  }

  // Curated games first in their hand-picked order, then anything new A→Z.
  return tiles.sort((a, b) => {
    const ai = CURATED_ORDER.indexOf(a.slug);
    const bi = CURATED_ORDER.indexOf(b.slug);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}
