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
          "/orders",
          "/account",
          "/login",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images`],
    host: siteUrl,
  };
}
