import type { MetadataRoute } from "next";
import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import { productSlugFromName } from "@/lib/product-route";
import { gameSeoContentFor } from "@/lib/game-seo-content";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const baseEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/status`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/loaders`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/videos`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/support`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/about/editorial-team`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/refund-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/terms-of-service`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const storefront = await getStorefrontData();

    // Build category URLs: prefer the clean /categories/[slug] form for any
    // game that has a dedicated SEO landing page; fall back to the legacy
    // query-param URL for the rest until we author content for them.
    const seenSlugs = new Set<string>();
    const categoryEntries = storefront.groups
      .map((group) => {
        const slug = toGameSlug(group.name);
        if (!slug) return null;
        const canonical = canonicalGameSlug(slug);
        if (seenSlugs.has(canonical)) return null;
        seenSlugs.add(canonical);

        const hasLandingPage = Boolean(gameSeoContentFor(canonical));
        const url = hasLandingPage
          ? `${siteUrl}/categories/${canonical}`
          : `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`;

        return {
          url,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: hasLandingPage ? 0.9 : 0.7,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const productEntries = storefront.products.map((product) => ({
      url: `${siteUrl}/products/${productSlugFromName(product.name, product.id)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    }));

    return [...baseEntries, ...categoryEntries, ...productEntries];
  } catch {
    return baseEntries;
  }
}
