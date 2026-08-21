import type { MetadataRoute } from "next";
import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import { productHref } from "@/lib/product-route";
import { blogPostsByDate } from "@/lib/blog-posts";
import { AFFILIATE_GUIDES } from "@/lib/affiliate-guides";
import { gameSeoContentFor, allGameSeoSlugs } from "@/lib/game-seo-content";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

/**
 * Rebuild hourly instead of only at deploy.
 *
 * The sitemap was fully static, so it kept advertising products for as long as
 * it took someone to redeploy after pulling them from the catalogue — and a
 * sitemap listing URLs that no longer resolve is the fastest way to fail a
 * Search Console validation. An hour is well inside how often Google refetches
 * it and costs one catalogue read per hour.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const baseEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/status`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
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

  // Authored content does not depend on the storefront, so it is built outside
  // the try. Inside it, a SellAuth or Supabase failure would drop every blog
  // and affiliate URL from the sitemap for as long as the outage lasted.
  const affiliateEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/affiliates`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...AFFILIATE_GUIDES.map((guide) => ({
      url: `${siteUrl}/affiliates/${guide.slug}`,
      lastModified: new Date(guide.updated),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPostsByDate().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

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

        // Only games with a landing page belong here. The others used to be
        // listed under their legacy ?slug= form, which now 308s to the clean
        // URL — and a sitemap full of redirects is a sitemap Search Console
        // reports as containing incorrect pages. Write the content in
        // game-seo-content.ts and the category appears here automatically.
        if (!gameSeoContentFor(canonical)) return null;

        return {
          url: `${siteUrl}/categories/${canonical}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.9,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);



    const productEntries = storefront.products.map((product) => ({
      url: `${siteUrl}${productHref(product)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    }));

    return [
      ...baseEntries,
      ...landingEntries,
      ...categoryEntries,
      ...productEntries,
      ...blogEntries,
      ...affiliateEntries,
    ];
  } catch {
    return [...baseEntries, ...landingEntries, ...blogEntries, ...affiliateEntries];
  }
}
