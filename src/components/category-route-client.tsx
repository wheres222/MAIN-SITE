"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameCatalogPage } from "@/components/game-catalog-page";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { isSameGameSlug } from "@/lib/game-slug";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { SellAuthGroup, StorefrontData } from "@/types/sellauth";

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function CategoryRouteClient() {
  const searchParams = useSearchParams();
  const slug = (searchParams.get("slug") || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const payload = await fetchStorefrontClient();
        if (!alive) return;
        setStorefront(payload);
        setError("");
      } catch (requestError) {
        if (!alive) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load categories."
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!storefront || !slug) return null;

    const matchedCategory = storefront.categories.find((item) =>
      isSameGameSlug(item.name, slug)
    );

    const products = storefront.products.filter((product) => {
      if (matchedCategory && product.categoryId === matchedCategory.id) return true;
      if (matchedCategory && product.groupId === matchedCategory.id) return true;
      if (product.categoryName && isSameGameSlug(product.categoryName, slug)) return true;
      if (product.groupName && isSameGameSlug(product.groupName, slug)) return true;
      return false;
    });

    const matchedGroup =
      storefront.groups.find((item) => isSameGameSlug(item.name, slug)) ||
      storefront.groups.find((item) => item.id === products[0]?.groupId);

    const fallbackImage =
      matchedCategory?.image?.url || products[0]?.image || "/games/fortnite.svg";

    const group: SellAuthGroup =
      matchedGroup ??
      ({
        id: matchedCategory?.id || 0,
        name: matchedCategory?.name || titleCaseFromSlug(slug),
        description: matchedCategory?.description || "",
        image: { url: fallbackImage },
      } satisfies SellAuthGroup);

    return { group, products };
  }, [slug, storefront]);

  if (loading) {
    return <SubpageSkeleton rows={6} />;
  }

  if (error) {
    return <p className="state-message error" style={{ padding: "20px" }}>{error}</p>;
  }

  if (!slug) {
    return (
      <p className="state-message" style={{ padding: "20px" }}>
        Missing category link. <Link href="/">Back to store</Link>
      </p>
    );
  }

  if (!resolved) {
    return (
      <p className="state-message" style={{ padding: "20px" }}>
        Category not found. <Link href="/">Back to store</Link>
      </p>
    );
  }

  const siteUrl =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cheatparadise.com";

  const categoryUrl = `${siteUrl}/categories?slug=${encodeURIComponent(slug)}`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${resolved.group.name} Marketplace`,
    description:
      resolved.group.description || `Browse ${resolved.group.name} products with fast delivery.`,
    url: categoryUrl,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: resolved.group.name,
        item: categoryUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GameCatalogPage group={resolved.group} products={resolved.products} />
    </>
  );
}
