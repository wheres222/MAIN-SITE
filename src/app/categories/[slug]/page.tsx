import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCatalogPage } from "@/components/game-catalog-page";
import { GameLandingIntro, GameLandingFaq } from "@/components/game-landing-seo";
import { getStorefrontData } from "@/lib/sellauth";
import { canonicalGameSlug, isSameGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor, allGameSeoSlugs } from "@/lib/game-seo-content";
import { productHref } from "@/lib/product-route";
import type { SellAuthGroup } from "@/types/sellauth";

export const revalidate = 300;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export async function generateStaticParams() {
  return allGameSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonical = canonicalGameSlug(slug);
  const content = gameSeoContentFor(canonical);

  if (!content) {
    return {
      title: "Game Cheats",
      description:
        "Buy undetected game cheats with instant delivery and 24/7 support on Cheat Paradise.",
    };
  }

  const url = `${siteUrl}/categories/${content.slug}`;

  return {
    title: content.title,
    description: content.metaDescription,
    alternates: { canonical: `/categories/${content.slug}` },
    openGraph: {
      title: content.title,
      description: content.metaDescription,
      url,
      type: "website",
      siteName: "Cheat Paradise",
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.metaDescription,
    },
  };
}

export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonical = canonicalGameSlug(slug);
  const content = gameSeoContentFor(canonical);

  if (!content) {
    notFound();
  }

  let storefront;
  try {
    storefront = await getStorefrontData();
  } catch {
    notFound();
  }

  // Resolve products + group exactly like the legacy ?slug= route does, so
  // the catalog grid renders the same content but at a clean URL.
  const matchedCategory = storefront.categories.find((item) =>
    isSameGameSlug(item.name, content.slug)
  );

  const products = storefront.products.filter((product) => {
    if (matchedCategory && product.categoryId === matchedCategory.id) return true;
    if (matchedCategory && product.groupId === matchedCategory.id) return true;
    if (product.categoryName && isSameGameSlug(product.categoryName, content.slug)) return true;
    if (product.groupName && isSameGameSlug(product.groupName, content.slug)) return true;
    return false;
  });

  const matchedGroup =
    storefront.groups.find((item) => isSameGameSlug(item.name, content.slug)) ||
    storefront.groups.find((item) => item.id === products[0]?.groupId);

  const fallbackImage =
    matchedCategory?.image?.url || products[0]?.image || "/placeholders/category-banner-not-added.svg";

  const group: SellAuthGroup =
    matchedGroup ??
    ({
      id: matchedCategory?.id || 0,
      name: matchedCategory?.name || content.displayName,
      description: matchedCategory?.description || "",
      image: { url: fallbackImage },
    } satisfies SellAuthGroup);

  // ── Schema: BreadcrumbList ─────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${siteUrl}/categories` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${content.displayName} Cheats`,
        item: `${siteUrl}/categories/${content.slug}`,
      },
    ],
  };

  // ── Schema: FAQPage (still useful for AI extraction even without rich results)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  // ── Schema: ItemList wrapping the product grid ─────────────────────────────
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${content.displayName} Cheats`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}${productHref(product)}`,
      name: product.name,
    })),
  };

  // ── Schema: CollectionPage (entity hub) ────────────────────────────────────
  // dateModified is the freshness signal Google explicitly checks per the
  // March 2026 core update — pages "recently verified" rank measurably higher.
  // We refresh this with each deploy via `new Date()`. If we author per-page
  // last-verified dates later (e.g. from a CMS), substitute that value here.
  const nowIso = new Date().toISOString();
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: content.title,
    description: content.metaDescription,
    url: `${siteUrl}/categories/${content.slug}`,
    inLanguage: "en-US",
    datePublished: "2026-05-01",
    dateModified: nowIso,
    isPartOf: {
      "@type": "WebSite",
      name: "Cheat Paradise",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Cheat Paradise",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Products render first (conversion-optimised — users see what they
          came for before scrolling through long-form content). Intro + FAQ
          sit below, still server-rendered so Google indexes the lot. */}
      <GameCatalogPage
        group={group}
        products={products}
        seoFooter={
          <>
            <GameLandingIntro content={content} />
            <GameLandingFaq content={content} />
          </>
        }
      />
    </>
  );
}
