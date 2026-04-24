import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";
import { getStorefrontData } from "@/lib/sellauth";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 120;

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

  return (
    <>
      {lcpProxyUrl && (
        <link rel="preload" as="image" href={lcpProxyUrl} fetchPriority="high" />
      )}
      <StorefrontClient initialData={initialData} />
    </>
  );
}
