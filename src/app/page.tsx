import type { Metadata } from "next";
import { StorefrontClient } from "@/components/storefront-client";

export const metadata: Metadata = {
  title: {
    absolute: "Cheat Paradise",
  },
  description:
    "The #1 cheat marketplace access custom cheats, tools, and enhancements for a better gaming experience",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <StorefrontClient />;
}
