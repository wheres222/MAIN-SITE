import type { NextConfig } from "next";

const configuredHosts =
  process.env.NEXT_IMAGE_REMOTE_HOSTS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean) ?? [];

const imageHosts =
  configuredHosts.length > 0
    ? configuredHosts
    : ["api.sellauth.com", "**.mysellauth.com"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  async redirects() {
    return [
      // /products/:productId and /categories/:categorySlug redirects were
      // removed — they were intercepting the new clean-URL routes at
      // src/app/products/[slug] and src/app/categories/[slug], preventing
      // the SEO landing pages from ever rendering. The clean URL is now the
      // canonical form; the legacy query-param URL self-redirects to the
      // clean URL via src/app/categories/page.tsx when a landing page exists.

      // Legacy /games/* paths still redirect into the category route.
      {
        source: "/games/:gameSlug",
        destination: "/categories?slug=:gameSlug",
        permanent: false,
      },
      {
        source: "/orders/mock",
        destination: "/orders?orderId=mock",
        permanent: false,
      },
      {
        source: "/orders/:orderId",
        destination: "/orders?orderId=:orderId",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      // Long-term caching for immutable static assets
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/branding/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/social/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/placeholders/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // script-src — explicit allowlist of CDNs we load JS from.
              // jsdelivr powers @widgetbot/html-embed. posthog hosts the
              // analytics SDK + config. googletagmanager + google-analytics
              // power the gtag snippet in src/app/layout.tsx.
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.posthog.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "media-src 'self' blob:",
              // connect-src — wss: needed for Supabase realtime websocket.
              // The wildcard https: already covers PostHog ingest, SellAuth,
              // NowPayments, Supabase REST.
              "connect-src 'self' https: wss:",
              // frame-src — domains we're allowed to embed iframes from.
              // widgetbot.io renders the Discord chat embed via e.widgetbot.io.
              "frame-src https://odysee.com https://www.youtube.com https://player.vimeo.com https://e.widgetbot.io https://*.widgetbot.io",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

