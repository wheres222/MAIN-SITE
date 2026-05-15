
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getStorefrontData } from "@/lib/sellauth";
import { CategoryRouteClient } from "@/components/category-route-client";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { canonicalGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Game Categories",
    description:
      "Browse cheat categories by game — Rust, ARC Raiders, Rainbow Six Siege, and more. Instant delivery, 24/7 support.",
    alternates: { canonical: "/categories" },
  };
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  // Legacy URL: 301-redirect /categories?slug=rust → /categories/rust when we
  // have an SEO landing page for it. Preserves any existing backlinks /
  // bookmarks pointing at the old query-param form.
  if (slug) {
    const canonical = canonicalGameSlug(slug);
    if (gameSeoContentFor(canonical)) {
      redirect(`/categories/${canonical}`);
    }
  }

  let initialData: StorefrontData | null = null;
  try {
    initialData = await getStorefrontData();
  } catch {
    // Client-side fetch will handle it
  }
  return (
    <Suspense fallback={<SubpageSkeleton rows={4} />}>
      <CategoryRouteClient initialData={initialData} />
    </Suspense>
  );
}
