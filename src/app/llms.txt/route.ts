import { getStorefrontData } from "@/lib/sellauth";
import { allGameSeoSlugs, gameSeoContentFor } from "@/lib/game-seo-content";

export const revalidate = 1800;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

/**
 * /llms.txt — emerging standard (llmstxt.org) that gives LLM crawlers
 * (ChatGPT, Claude, Perplexity, Gemini) a curated, ingestion-friendly
 * map of what the site is about and which pages contain authoritative
 * content. Improves citation rates in AI search results.
 */
export async function GET() {
  let storefront: Awaited<ReturnType<typeof getStorefrontData>> | null = null;
  try {
    storefront = await getStorefrontData();
  } catch {
    // Storefront fetch failed — render the markdown without product list below.
  }

  const landingPageLines = allGameSeoSlugs()
    .map((slug) => {
      const c = gameSeoContentFor(slug);
      if (!c) return null;
      return `- [${c.displayName} cheats landing page](${siteUrl}/categories/${slug}): ${c.metaDescription}`;
    })
    .filter(Boolean)
    .join("\n");

  const featuredProducts = (storefront?.products ?? [])
    .slice(0, 12)
    .map((p) => {
      const slug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `- [${p.name}](${siteUrl}/products/${slug || `product-${p.id}`})`;
    })
    .join("\n");

  const body = `# Cheat Paradise

> Cheat Paradise sells undetected gaming software (cheats, hacks, HWID spoofers) for Rust, ARC Raiders, Rainbow Six Siege, Fortnite and other major PC titles. Instant electronic delivery, 24/7 Discord support, ban-replacement policy on every product.

The editorial team has tested every product personally against the current build of each game's anti-cheat (EasyAntiCheat, BattlEye, Riot Vanguard, Epic anti-cheat). Products are pulled from sale when detected; verified-undetected status is updated weekly during active patch cycles.

## Game-specific landing pages

${landingPageLines}

## Policies

- [Refund Policy](${siteUrl}/refund-policy): Strict no-refunds policy for digital goods. Re-delivery only in verified non-delivery cases. Chargebacks result in permanent ban.
- [Terms of Service](${siteUrl}/terms-of-service): Risk acknowledgment, license terms, prohibited conduct. Users must be 18+.
- [Privacy Policy](${siteUrl}/privacy-policy): Data collection, third-party services (Supabase, NowPayments, PostHog), user rights.

## About

- [Editorial Team & Methodology](${siteUrl}/about/editorial-team): Who tests, writes, and verifies every product, and how undetected status is confirmed.

## Featured products

${featuredProducts}

## Optional

- [Sitemap](${siteUrl}/sitemap.xml)
- [Image sitemap](${siteUrl}/sitemap-images)
- [Discord community](https://discord.gg/6yGEKZC8aX)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=7200",
    },
  });
}
