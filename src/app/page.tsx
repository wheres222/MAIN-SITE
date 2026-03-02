import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";

export const metadata: Metadata = {
  title: "Cheap Gaming Marketplace",
  description:
    "Upgrade your gameplay with affordable mods, tools, accounts, and enhancements with instant delivery.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <StorefrontClient />;
}
