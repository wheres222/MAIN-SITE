import { getStorefrontData } from "@/lib/sellauth";
import { canonicalGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";
import { productSlugFromName } from "@/lib/product-route";

export const revalidate = 600;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Image sitemap — separate XML feed dedicated to product / game imagery.
 *
 * Google strongly prefers a separate image sitemap when the main sitemap is
 * already large, and JS-rendered images (Next.js Image component) are easier
 * for Googlebot to discover when listed explicitly here.
 */
export async function GET() {
  let storefront: Awaited<ReturnType<typeof getStorefrontData>> | null = null;
  try {
    storefront = await getStorefrontData();
  } catch {
    // Storefront fetch failed; return an empty image sitemap.
  }
  if (!storefront) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }

  // Build a Map: page URL -> array of image URLs visible on that page
  const pageImages = new Map<string, string[]>();

  // ── Landing pages: each category page references its banner image ──────────
  for (const product of storefront.products) {
    const slug = canonicalGameSlug(product.groupName || product.categoryName || "");
    if (!slug) continue;

    const pageUrl = gameSeoContentFor(slug)
      ? `${siteUrl}/categories/${slug}`
      : `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`;

    const productUrl = `${siteUrl}/products/${productSlugFromName(product.name, product.id)}`;

    if (product.image) {
      const arr = pageImages.get(pageUrl) || [];
      if (!arr.includes(product.image)) arr.push(product.image);
      pageImages.set(pageUrl, arr);

      pageImages.set(productUrl, [product.image]);
    }
  }

  // ── Homepage: lists all group banner images ────────────────────────────────
  const homepageImages: string[] = [];
  for (const group of storefront.groups) {
    if (group.image?.url) homepageImages.push(group.image.url);
  }
  if (homepageImages.length) {
    pageImages.set(`${siteUrl}/`, homepageImages);
  }

  // ── Build XML ──────────────────────────────────────────────────────────────
  const urls: string[] = [];
  pageImages.forEach((images, pageUrl) => {
    const imageBlocks = images
      .map(
        (img) => `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
    </image:image>`
      )
      .join("\n");

    urls.push(`  <url>
    <loc>${escapeXml(pageUrl)}</loc>
${imageBlocks}
  </url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
