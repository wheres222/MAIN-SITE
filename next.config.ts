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
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;
