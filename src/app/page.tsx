import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";
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
  duration: string;
  uploadDate: string;
}> = [
  {
    name: "Fortnite Cheat Gameplay Footage",
    description:
      "Live Fortnite gameplay using Cheat Paradise's undetected aimbot, ESP, and prediction features in Chapter 7 Season 2.",
    src: "/footage/fortnite.mp4",
    duration: "PT50S",
    uploadDate: "2026-05-14",
  },
  {
    name: "ARC Raiders Cheat Gameplay Footage",
    description:
      "Extraction shooter gameplay demonstrating Cheat Paradise's ARC Raiders ESP, silent aim, and loot filter.",
    src: "/footage/arc.mp4",
    duration: "PT50S",
    uploadDate: "2026-05-14",
  },
  {
    name: "Rust Cheat Gameplay Footage",
    description:
      "Live Rust raid footage using Cheat Paradise's undetected external cheat with full player ESP, item ESP, and aimbot.",
    src: "/footage/rust.mp4",
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
      thumbnailUrl: `${siteUrl}/branding/og-banner.png`,
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
    absolute: "Cheat Paradise",
  },
  description:
    "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
  alternates: {
    canonical: "/",
  },
};

const PRIORITY_SLUG_ORDER = ["rust", "arc-raiders", "call-of-duty", "fortnite"];

function pickLcpImageUrl(data: StorefrontData): string | null {
  if (!data.groups?.length) return null;
  const sorted = [...data.groups].sort((a, b) => {
    const ai = PRIORITY_SLUG_ORDER.findIndex((s) =>
      a.name?.toLowerCase().replace(/\s+/g, "-").includes(s)
    );
    const bi = PRIORITY_SLUG_ORDER.findIndex((s) =>
      b.name?.toLowerCase().replace(/\s+/g, "-").includes(s)
    );
    const ap = ai === -1 ? 999 : ai;
    const bp = bi === -1 ? 999 : bi;
    return ap - bp;
  });
  const first = sorted.find((g) => g.image?.url && g.image.url.startsWith("http"));
  return first?.image?.url ?? null;
}

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

  const lcpImageUrl = initialData ? pickLcpImageUrl(initialData) : null;
  const lcpProxyUrl = lcpImageUrl
    ? `/_next/image?url=${encodeURIComponent(lcpImageUrl)}&w=828&q=75`
    : null;

  const videoSchemas = buildVideoSchemas();

  return (
    <>
      {lcpProxyUrl && (
        <link rel="preload" as="image" href={lcpProxyUrl} fetchPriority="high" />
      )}
      {videoSchemas.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
      <StorefrontClient initialData={initialData} />
    </>
  );
}
