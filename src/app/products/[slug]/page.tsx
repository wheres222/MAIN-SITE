import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductRouteClient } from "@/components/product-route-client";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { getStorefrontData } from "@/lib/sellauth";
import { productSlugFromName } from "@/lib/product-route";

export const runtime = "edge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const storefront = await getStorefrontData();
    const product = storefront.products.find(
      (p) => productSlugFromName(p.name, p.id) === slug.toLowerCase()
    );

    if (product) {
      const title = product.name;
      const description =
        product.description ||
        `Buy ${product.name} with instant delivery and secure checkout on Cheat Paradise.`;
      const canonical = `/products/${productSlugFromName(product.name, product.id)}`;

      return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
          title,
          description,
          url: `${siteUrl}${canonical}`,
          images: product.image ? [{ url: product.image }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: product.image ? [product.image] : undefined,
        },
      };
    }
  } catch {
    // Fall through to default metadata
  }

  return {
    title: "Products",
    description:
      "Browse game cheats and hacks for Rust, Valorant, Fortnite, COD, CS2, Apex, R6, and more. Instant delivery, secure checkout, and 24/7 support.",
    alternates: { canonical: "/products" },
  };
}

export default function ProductSlugPage() {
  return (
    <Suspense fallback={<SubpageSkeleton rows={5} />}>
      <ProductRouteClient />
    </Suspense>
  );
}
