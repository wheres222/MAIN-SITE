import { canonicalGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";
import { productHref } from "@/lib/product-route";
import type { SellAuthProduct } from "@/types/sellauth";

/**
 * No AggregateRating is emitted, deliberately.
 *
 * These pages used to carry one built from the product id — a rating between
 * 3.6 and 5.0 and a review count between 14 and 87, for products nobody had
 * reviewed. Google's structured data policy requires marked-up ratings to come
 * from real reviews that are visible on the page; invented ones are grounds for
 * a manual action against the whole site, which costs far more than the star
 * snippet is worth.
 *
 * When real reviews exist — Trustpilot's API, or an in-house table — build
 * aggregateRating from those numbers and render the same values on the page.
 * Until then this stays absent.
 */

function categorySlugFor(product: SellAuthProduct): string {
  const source = product.categoryName || product.groupName || "";
  return canonicalGameSlug(source);
}

/**
 * Pick the category URL for the breadcrumb — the clean URL when we have a
 * landing page for the slug, the index otherwise.
 */
function breadcrumbCategoryUrl(product: SellAuthProduct, siteUrl: string): string {
  const slug = categorySlugFor(product);
  if (!slug) return `${siteUrl}/categories`;
  if (gameSeoContentFor(slug)) return `${siteUrl}/categories/${slug}`;
  // The ?slug= form now 308s to the clean URL, and a breadcrumb pointing at a
  // redirect is a structured-data item pointing somewhere that is not the page
  // it claims. Fall back to the index instead.
  return `${siteUrl}/categories`;
}

/**
 * Schema image URLs must be absolute. Local art is stored as "/pd/rust.avif",
 * and emitting that verbatim is an invalid value — which is what the
 * "structured data items are invalid" audit finding was counting.
 */
function absoluteImage(value: string | undefined, siteUrl: string): string | undefined {
  const src = value?.trim();
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return `${siteUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}

/**
 * Build the full set of JSON-LD schemas for a product page:
 * - Product (with Offer)
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
  const price =
    typeof product.price === "number"
      ? product.price.toFixed(2)
      : product.variants?.[0]?.price?.toFixed?.(2);
  const availability =
    typeof product.stock === "number" && product.stock <= 0
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

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
    image: absoluteImage(product.image, siteUrl)
      ? [absoluteImage(product.image, siteUrl)]
      : undefined,
    url: productUrl,
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

  // SoftwareApplication is no longer emitted.
  //
  // It was here for the software rich result, which Google only awards when the
  // item carries aggregateRating — and the rating we used to supply was
  // invented from the product id, so it had to go. Left in place the schema
  // could never qualify, and every validator reports it as missing a required
  // field: a permanent error for a snippet that was never attainable.
  //
  // Product with a real Offer is valid on its own and is what these pages
  // should be. If genuine reviews are ever wired up, this can come back with
  // aggregateRating built from them.

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
    JSON.stringify(breadcrumbSchema),
  ];
}
