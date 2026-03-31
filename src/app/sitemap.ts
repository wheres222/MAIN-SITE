import type { MetadataRoute } from "next";
import { toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import { productSlugFromName } from "@/lib/product-route";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const baseEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/status`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/support`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/terms-of-service`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const storefront = await getStorefrontData();

    const categoryEntries = storefront.groups
      .map((group) => toGameSlug(group.name))
      .filter(Boolean)
      .map((slug) => ({
        url: `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));

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
