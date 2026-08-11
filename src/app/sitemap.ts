import type { MetadataRoute } from "next";
import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import { productHref } from "@/lib/product-route";
import { gameSeoContentFor, allGameSeoSlugs } from "@/lib/game-seo-content";
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

  // Every authored SEO landing page gets a sitemap entry unconditionally —
  // these are prerendered via generateStaticParams and must be indexable even
  // when the matching SellAuth group is temporarily missing or renamed.
  const seenSlugs = new Set<string>();
  const landingEntries: MetadataRoute.Sitemap = allGameSeoSlugs().map((slug) => {
    seenSlugs.add(slug);
    return {
      url: `${siteUrl}/categories/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    };
  });

  try {
    const storefront = await getStorefrontData();

    // Remaining storefront groups without an authored landing page fall back
    // to the legacy query-param URL until content is written for them.
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
      url: `${siteUrl}${productHref(product)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    }));

    return [...baseEntries, ...landingEntries, ...categoryEntries, ...productEntries];
  } catch {
    return [...baseEntries, ...landingEntries];
  }
}
