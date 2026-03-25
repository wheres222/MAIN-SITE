import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";

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

export default function Home() {
  return <StorefrontClient />;
}
