import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRouteClient } from "@/components/category-route-client";
import { SubpageSkeleton } from "@/components/subpage-skeleton";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await searchParams;

  if (slug) {
    const name = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${name} Cheats & Hacks`,
      description: `Buy undetected ${name} cheats, hacks, and mods with instant delivery. Secure checkout and 24/7 support on Cheat Paradise.`,
      alternates: { canonical: `/categories?slug=${encodeURIComponent(slug)}` },
      openGraph: {
        title: `${name} Cheats & Hacks`,
        description: `Buy undetected ${name} cheats with instant delivery on Cheat Paradise.`,
        url: `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`,
      },
    };
  }

  return {
    title: "Game Categories",
    description:
      "Browse cheat categories by game — Rust, Valorant, Fortnite, COD, CS2, Apex, Rainbow Six Siege, and more. Instant delivery.",
    alternates: { canonical: "/categories" },
  };
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<SubpageSkeleton rows={4} />}>
      <CategoryRouteClient />
    </Suspense>
  );
}
