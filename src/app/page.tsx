import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";
import { HomeSeoSections } from "@/components/home-seo-sections";
import { getStorefrontData } from "@/lib/sellauth";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

// VideoObject schema for the gameplay footage shown on the landing page.
// Unlocks video previews in Google SERPs and feeds AI engines extractable
// metadata about each clip. Update uploadDate if you re-record / re-encode.
const FOOTAGE_VIDEOS: Array<{
  name: string;
  description: string;
  src: string;
  poster: string;
  duration: string;
  uploadDate: string;
}> = [
  {
    name: "Fortnite Cheat Gameplay Footage",
    description:
      "Live Fortnite gameplay using Cheat Paradise's undetected aimbot, ESP, and prediction features in Chapter 7 Season 2.",
    src: "/footage/fortnite.mp4",
    poster: "/footage/fortnite-poster.webp",
    duration: "PT50S",
    uploadDate: "2026-05-14",
  },
  {
    name: "ARC Raiders Cheat Gameplay Footage",
    description:
      "Extraction shooter gameplay demonstrating Cheat Paradise's ARC Raiders ESP, silent aim, and loot filter.",
    src: "/footage/arc.mp4",
    poster: "/footage/arc-poster.webp",
    duration: "PT50S",
    uploadDate: "2026-05-14",
  },
  {
    name: "Rust Cheat Gameplay Footage",
    description:
      "Live Rust raid footage using Cheat Paradise's undetected external cheat with full player ESP, item ESP, and aimbot.",
    src: "/footage/rust.mp4",
    poster: "/footage/rust-poster.webp",
    duration: "PT50S",
    uploadDate: "2026-05-14",
  },
];

function buildVideoSchemas() {
  return FOOTAGE_VIDEOS.map((video) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.name,
      description: video.description,
      thumbnailUrl: `${siteUrl}${video.poster}`,
      contentUrl: `${siteUrl}${video.src}`,
      uploadDate: video.uploadDate,
      duration: video.duration,
      publisher: {
        "@type": "Organization",
        name: "Cheat Paradise",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/branding/LOGO.webp`,
        },
      },
    })
  );
}

export const metadata: Metadata = {
  title: {
    absolute: "Cheat Paradise — Undetected Rust, CS2 & ARC Raiders Cheats",
  },
  description:
    "Buy undetected game cheats with instant delivery. Rust cheats, CS2 cheats, ARC Raiders cheats, Fortnite, COD, Apex & more — trusted by thousands. 24/7 support.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  let initialData: StorefrontData | null = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 3000)
    );
    initialData = await Promise.race([getStorefrontData(), timeout]);
  } catch {
    // Fall through to client-side fetch on error
  }

  const videoSchemas = buildVideoSchemas();

  return (
    <>
      {/* The hero background is the LCP element. CSS background-images are only
          discovered after the stylesheet parses, so preload it — one per
          breakpoint, matching the media queries in globals.css. */}
      <link
        rel="preload"
        as="image"
        href="/branding/hero-bg.avif"
        type="image/avif"
        media="(min-width: 1201px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/branding/hero-bg-md.avif"
        type="image/avif"
        media="(min-width: 761px) and (max-width: 1200px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/branding/hero-bg-sm.avif"
        type="image/avif"
        media="(max-width: 760px)"
        fetchPriority="high"
      />
      {videoSchemas.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
      <StorefrontClient initialData={initialData} seoContent={<HomeSeoSections />} />
    </>
  );
}
