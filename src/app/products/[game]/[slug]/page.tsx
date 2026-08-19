import type { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { ProductRouteClient } from "@/components/product-route-client";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { getStorefrontData } from "@/lib/sellauth";
import {
  findProductByRoute,
  productGameName,
  productHref,
  productSeoTitle,
} from "@/lib/product-route";
import { buildProductSchemas } from "@/lib/product-schemas";
import { productSeoContentFor } from "@/lib/product-seo-content";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

type RouteParams = Promise<{ game: string; slug: string }>;

/**
 * Meta description for a product page.
 *
 * SellAuth descriptions are raw HTML and were being passed straight into the
 * meta tag — so search results carried literal markup
 * ("&lt;p class=&quot;e-paragraph&quot;...") and several products shared the
 * same boilerplate, which is where the duplicate-description warnings came
 * from. Prefer our own editorial intro, unique per product by construction;
 * fall back to the supplier text with tags stripped; fall back again to a
 * generated sentence.
 */
function metaDescriptionFor(
  product: SellAuthProduct,
  gameName: string,
  intro?: string
): string {
  const clamp = (value: string) =>
    value.length > 158 ? value.slice(0, 155).trimEnd() + "…" : value;

  const ours = (intro ?? "").replace(/\s+/g, " ").trim();
  if (ours.length >= 60) return clamp(ours);

  const fromSupplier = (product.description ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;|&gt;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (fromSupplier.length >= 60) return clamp(fromSupplier);

  return gameName
    ? `Buy ${product.name} for ${gameName} — undetected, instant delivery and secure checkout on Cheat Paradise.`
    : `Buy ${product.name} with instant delivery and secure checkout on Cheat Paradise.`;
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { game, slug } = await params;

  try {
    const storefront = await getStorefrontData();
    const product = findProductByRoute(storefront.products, game, slug);

    if (product) {
      // Title and description lead with product + game because that is the
      // shape of the queries these pages compete for ("ancient arc raiders",
      // "crusader r6"). The old title was the bare product name, which matched
      // only half of any such search.
      const gameName = productGameName(product);
      const title = productSeoTitle(product);
      const description = metaDescriptionFor(
        product,
        gameName,
        productSeoContentFor(product)?.intro?.[0]
      );
      const canonical = productHref(product);

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

export default async function ProductSlugPage({ params }: { params: RouteParams }) {
  const { game, slug } = await params;

  // generateMetadata already called getStorefrontData() for this request —
  // the module-level cache means this second call is free (no extra fetch).
  let initialData: StorefrontData | null = null;
  try {
    initialData = await getStorefrontData();
  } catch {
    // Client will fall back to its own fetch
  }

  // Resolve the product so we can SSR the full JSON-LD schema set into the
  // initial HTML response — Googlebot picks this up immediately, no JS needed.
  let resolvedProduct: SellAuthProduct | null = null;
  if (initialData) {
    resolvedProduct = findProductByRoute(initialData.products, game, slug);

    // One canonical URL per product. A resolvable-but-non-canonical path (an
    // un-stripped leaf, or the wrong case) redirects rather than serving the
    // same product at two addresses and splitting its ranking.
    if (resolvedProduct) {
      const canonical = productHref(resolvedProduct);
      if (canonical !== `/products/${game}/${slug}`) {
        permanentRedirect(canonical);
      }
    }
  }

  const seoContent = resolvedProduct
    ? productSeoContentFor(resolvedProduct)
    : null;

  const schemas = resolvedProduct
    ? buildProductSchemas(resolvedProduct, siteUrl)
    : [];

  // FAQPage only when the product actually has questions rendered on the page.
  // Marking up questions that do not appear in the visible content is a
  // structured-data violation, not a shortcut.
  if (seoContent && seoContent.faqs.length > 0) {
    schemas.push(
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seoContent.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      })
    );
  }

  return (
    <>
      {schemas.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
      <Suspense fallback={<SubpageSkeleton rows={5} />}>
        <ProductRouteClient initialData={initialData} seoContent={seoContent} />
      </Suspense>
    </>
  );
}
