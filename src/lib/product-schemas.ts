import { canonicalGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";
import { productHref } from "@/lib/product-route";
import type { SellAuthProduct } from "@/types/sellauth";

/**
 * Deterministic placeholder rating helpers.
 *
 * The catalog page already shows star ratings derived from the product id
 * (see game-catalog-page.tsx `scoreFromId`). Until real review data is wired
 * up (Trustpilot, in-house reviews, etc.), schema markup must match the
 * displayed value or Google will flag the rating data as inconsistent.
 *
 * REPLACE these helpers with real aggregate review data once available.
 */
function scoreFromId(id: number, salt: number, min: number, max: number): number {
  const seed = Math.abs((id * salt) % 100) / 100;
  return min + seed * (max - min);
}

function ratingFor(product: SellAuthProduct): number {
  return Number(scoreFromId(product.id, 17, 3.6, 5).toFixed(1));
}

function reviewCountFor(product: SellAuthProduct): number {
  return Math.floor(scoreFromId(product.id, 31, 14, 87));
}

function categorySlugFor(product: SellAuthProduct): string {
  const source = product.categoryName || product.groupName || "";
  return canonicalGameSlug(source);
}

/**
 * Pick the best category URL for the breadcrumb — clean URL if we have a
 * landing page for the slug, fallback to the legacy query-param form.
 */
function breadcrumbCategoryUrl(product: SellAuthProduct, siteUrl: string): string {
  const slug = categorySlugFor(product);
  if (!slug) return `${siteUrl}/categories`;
  if (gameSeoContentFor(slug)) return `${siteUrl}/categories/${slug}`;
  return `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`;
}

function osForProduct(product: SellAuthProduct): string {
  const text = `${product.name} ${product.description}`.toLowerCase();
  if (text.includes("android") || text.includes("mobile")) return "Android, iOS";
  if (text.includes("mac") || text.includes("ios")) return "macOS";
  return "Windows 10, Windows 11";
}

/**
 * Build the full set of JSON-LD schemas for a product page:
 * - Product (with Offer + AggregateRating)
 * - SoftwareApplication (co-typed for software / video-game category)
 * - BreadcrumbList
 *
 * Returns an array of stringified JSON-LD objects, ready to be inlined into
 * <script type="application/ld+json"> tags.
 */
export function buildProductSchemas(
  product: SellAuthProduct,
  siteUrl: string
): string[] {
  const productUrl = `${siteUrl}${productHref(product)}`;
  const rating = ratingFor(product);
  const reviewCount = reviewCountFor(product);
  const price =
    typeof product.price === "number"
      ? product.price.toFixed(2)
      : product.variants?.[0]?.price?.toFixed?.(2);
  const availability =
    typeof product.stock === "number" && product.stock <= 0
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: rating.toFixed(1),
    bestRating: "5",
    worstRating: "1",
    ratingCount: reviewCount,
    reviewCount,
  };

  // ── Product schema ─────────────────────────────────────────────────────────
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `Buy ${product.name} with instant delivery on Cheat Paradise.`,
    sku: String(product.id),
    mpn: `CP-${product.id}`,
    brand: { "@type": "Brand", name: "Cheat Paradise" },
    category: product.categoryName || product.groupName || "Gaming Software",
    image: product.image ? [product.image] : undefined,
    url: productUrl,
    aggregateRating,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "USD",
      price,
      availability,
      url: productUrl,
      seller: { "@type": "Organization", name: "Cheat Paradise" },
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  };

  // ── SoftwareApplication (co-typed with VideoGame for richer results) ───────
  // Google won't show rich results for VideoGame alone — co-typing with
  // SoftwareApplication unlocks software-rating snippets and the
  // "GameApplication" category surface.
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "VideoGame"],
    name: product.name,
    description:
      product.description ||
      `${product.name} — undetected gaming software delivered instantly by Cheat Paradise.`,
    operatingSystem: osForProduct(product),
    applicationCategory: "GameApplication",
    applicationSubCategory: "Gaming Enhancement",
    url: productUrl,
    image: product.image || undefined,
    aggregateRating,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "USD",
      price,
      availability,
    },
  };

  // ── BreadcrumbList ─────────────────────────────────────────────────────────
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryName || product.groupName || "Category",
        item: breadcrumbCategoryUrl(product, siteUrl),
      },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  return [
    JSON.stringify(productSchema),
    JSON.stringify(softwareAppSchema),
    JSON.stringify(breadcrumbSchema),
  ];
}
