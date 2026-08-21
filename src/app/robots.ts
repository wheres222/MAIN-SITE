import type { MetadataRoute } from "next";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule — everything else (including GPTBot, ClaudeBot,
      // PerplexityBot, Google-Extended, Bingbot) is allowed by omission.
      // Per the 2026 AI search research, we explicitly do NOT block AI
      // crawlers because brand mentions + content extraction from this
      // site are direct levers for ranking in AI Overviews / Perplexity.
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // NOTE: /orders is deliberately absent.
          //
          // It was disallowed here while also serving <meta name="robots"
          // content="noindex">, which is self-defeating: a page Google is
          // forbidden to fetch is a page whose noindex Google never reads, so
          // the URL stays eligible for indexing on the strength of inbound
          // links alone. Search Console filed it under "Blocked by robots.txt"
          // rather than dropping it.
          //
          // Letting the crawl through is what makes the noindex effective.
          // Nothing is exposed by doing so: order lookup requires an order ID
          // plus the token emailed at checkout, neither of which a crawler has.
          "/account",
          "/admin",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
      "/checkout/",
          "/order/",
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images`],
    host: siteUrl,
  };
}
