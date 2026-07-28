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

function prettySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
    const name = prettySlug(canonical);
    return {
      title: `${name} Cheats`,
      description: `Buy undetected ${name} cheats with instant delivery and 24/7 support on Cheat Paradise.`,
      alternates: { canonical: `/categories/${canonical}` },
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
  const content = gameSeoContentFor(canonical); // optional — SEO long-form, only for some games

  let storefront;
  try {
    storefront = await getStorefrontData();
  } catch {
    notFound();
  }

  const matchSlug = content?.slug ?? canonical;

  const matchedCategory = storefront.categories.find((item) =>
    isSameGameSlug(item.name, matchSlug)
  );

  const products = storefront.products.filter((product) => {
    if (matchedCategory && product.categoryId === matchedCategory.id) return true;
    if (matchedCategory && product.groupId === matchedCategory.id) return true;
    if (product.categoryName && isSameGameSlug(product.categoryName, matchSlug)) return true;
    if (product.groupName && isSameGameSlug(product.groupName, matchSlug)) return true;
    return false;
  });

  const matchedGroup =
    storefront.groups.find((item) => isSameGameSlug(item.name, matchSlug)) ||
    storefront.groups.find((item) => item.id === products[0]?.groupId);

  // Truly nothing for this slug (no SEO page, no group, no products) → 404.
  if (!content && !matchedGroup && products.length === 0) {
    notFound();
  }

  const fallbackImage =
    matchedCategory?.image?.url || products[0]?.image || "/placeholders/category-banner-not-added.svg";

  const displayName =
    content?.displayName || matchedGroup?.name || matchedCategory?.name || prettySlug(canonical);

  const group: SellAuthGroup =
    matchedGroup ??
    ({
      id: matchedCategory?.id || 0,
      name: displayName,
      description: matchedCategory?.description || "",
      image: { url: fallbackImage },
    } satisfies SellAuthGroup);

  // ── Schemas: only for games with authored SEO content (avoid thin/fake rich data) ──
  const schemas: object[] = [];
  if (content) {
    schemas.push(
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Categories", item: `${siteUrl}/categories` },
          { "@type": "ListItem", position: 3, name: `${content.displayName} Cheats`, item: `${siteUrl}/categories/${content.slug}` },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
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
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: content.title,
        description: content.metaDescription,
        url: `${siteUrl}/categories/${content.slug}`,
        inLanguage: "en-US",
        datePublished: "2026-05-01",
        dateModified: new Date().toISOString(),
        isPartOf: { "@type": "WebSite", name: "Cheat Paradise", url: siteUrl },
        publisher: { "@type": "Organization", name: "Cheat Paradise", url: siteUrl },
      },
    );
  }

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <GameCatalogPage
        group={group}
        products={products}
        title={content?.h1}
        seoFooter={
          content ? (
            <>
              <GameLandingIntro content={content} />
              <GameLandingFaq content={content} />
            </>
          ) : undefined
        }
      />
    </>
  );
}
