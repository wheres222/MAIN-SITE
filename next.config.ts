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
        ],
      },
    ];
  },
};

export default nextConfig;
