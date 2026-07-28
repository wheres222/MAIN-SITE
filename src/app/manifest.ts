import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cheat Paradise",
    short_name: "CheatParadise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#050506",
    icons: [
      {
        src: "/branding/LOGO.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/branding/LOGO.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
