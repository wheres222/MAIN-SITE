import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cheat Paradise",
    short_name: "CheatParadise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    icons: [
      {
        src: "/branding/site-icon.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/branding/site-icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
