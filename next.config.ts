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
      {
        source: "/products/:productId",
        destination: "/products?id=:productId",
        permanent: false,
      },
      {
        source: "/categories/:categorySlug",
        destination: "/categories?slug=:categorySlug",
        permanent: false,
      },
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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' https:; frame-src https://odysee.com https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

