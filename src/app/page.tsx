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

export default async function Home() {
  let initialData: StorefrontData | null = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 800)
    );
    initialData = await Promise.race([getStorefrontData(), timeout]);
  } catch {
    // Fall through to client-side fetch on error
  }
  return <StorefrontClient initialData={initialData} />;
}
