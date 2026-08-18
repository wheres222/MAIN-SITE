import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoriesIndex } from "@/components/categories-index";
import { canonicalGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export const metadata: Metadata = {
  title: "Game Cheat Categories — Every Game We Stock",
  description:
    "Browse cheats by game: Rust, CS2, ARC Raiders, Rainbow Six Siege, Apex, Tarkov, Hell Let Loose and more. Live detection status and setup notes for each.",
  alternates: { canonical: "/categories" },
};

/**
 * The category index.
 *
 * This page used to hand off to a client component that only understood the
 * legacy ?slug= form. With no slug it rendered "Missing category link" — 14
 * words, no H1 — on a URL that sits in the sitemap and in every breadcrumb.
 * Google classified it as a Soft 404, correctly.
 *
 * It is now a real index, server-rendered, linking to every category page.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  // Legacy /categories?slug=rust → /categories/rust.
  //
  // Note this cannot fire while the route is ISR-cached, because a query string
  // is not part of the cache key — the redirect that actually works lives in
  // src/proxy.ts. This stays as a defence in depth for any request that does
  // reach the component.
  if (slug) {
    const canonical = canonicalGameSlug(slug);
    if (gameSeoContentFor(canonical)) redirect(`/categories/${canonical}`);
  }

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${siteUrl}/categories` },
    ],
  };

  return (
    <div className="marketplace-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <SiteHeader activeTab="store" />
      <main>
        <CategoriesIndex />
      </main>
      <SiteFooter />
    </div>
  );
}
