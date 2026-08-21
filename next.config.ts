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
    // 1 year — local sources are version-suffixed (e.g. /category/rust_v3.png)
    // so cache busting happens via the filename, never via TTL expiry.
    minimumCacheTTL: 31536000,
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

      // www -> apex domain. Both hosts answered 200 with the canonical pointing
      // at the apex domain, which Google handles correctly but crawls twice. A
      // 308 spends that budget on pages instead.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cheatparadise.com" }],
        destination: "https://cheatparadise.com/:path*",
        permanent: true,
      },

      // Legacy /games/* paths redirect straight to the clean category URL.
      // This used to point at /categories?slug=:gameSlug, which — now that the
      // query form itself redirects — would make every /games/* link a two-hop
      // chain. Google follows chains but discounts them.
      {
        source: "/games/:gameSlug",
        destination: "/categories/:gameSlug",
        permanent: true,
      },
      // /dashboard never existed as a route — the account area lives at
      // /account and the header's "Dashboard" item already points there. It is
      // the name people type anyway, so serve it rather than 404 on it.
      // Permanent so anyone who bookmarked the 404 gets corrected once.
      {
        source: "/dashboard",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/account/:path*",
        permanent: true,
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
        source: "/pd/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/category/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/status-icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // These five directories were serving on the default short TTL, which is
      // most of what PageSpeed's "use efficient cache lifetimes" was counting.
      // Same version-in-filename convention as the others, so immutable is safe.
      {
        source: "/hero/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/compare/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/category-cards/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/pd-hover/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/banners/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/games/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Immutable 1y — rename the file (poster + mp4) when re-recording
        // footage, same convention as the version-suffixed category images.
        source: "/footage/:path*",
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
              // jsdelivr powers @widgetbot/html-embed. googletagmanager and
              // google-analytics power the gtag snippet in src/app/layout.tsx.
              // assistify.chat serves the support widget mounted by
              // <AssistifyScript> — it was
              // missing here, so the widget was refused on every page load and
              // support chat never appeared for anyone.
              // va.vercel-scripts.com is Vercel Analytics: on a Vercel deploy it
              // serves from /_vercel/insights/script.js (same origin), but in dev —
              // and any non-Vercel environment — it falls back to that host, so
              // leaving it out breaks analytics everywhere except production.
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://assistify.chat https://*.assistify.chat https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://assistify.chat https://*.assistify.chat",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "media-src 'self' blob:",
              // connect-src — wss: needed for Supabase realtime websocket.
              // The wildcard https: already covers SellAuth, NowPayments and
              // Supabase REST.
              "connect-src 'self' https: wss:",
              // frame-src — domains we're allowed to embed iframes from.
              // widgetbot.io renders the Discord chat embed via e.widgetbot.io.
              // assistify.chat mounts its support chat in an iframe.
              "frame-src https://odysee.com https://www.youtube.com https://player.vimeo.com https://e.widgetbot.io https://*.widgetbot.io https://assistify.chat https://*.assistify.chat",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

