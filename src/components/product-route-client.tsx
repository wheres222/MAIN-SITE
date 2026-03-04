"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductDetailPage } from "@/components/product-detail-page";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { productHref, productSlugFromName } from "@/lib/product-route";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { StorefrontData } from "@/types/sellauth";

function upsertMeta(
  selector: { key: "name" | "property"; value: string },
  content: string
) {
  if (typeof document === "undefined") return;

  const query = `meta[${selector.key}="${selector.value}"]`;
  let element = document.head.querySelector(query) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(selector.key, selector.value);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertCanonical(url: string) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector('link[rel="canonical"]') as
    | HTMLLinkElement
    | null;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

function safeDecoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function ProductRouteClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams<{ slug?: string | string[] }>();

  const pidRaw = (searchParams.get("pid") || "").trim();
  const idRaw = (searchParams.get("id") || "").trim();

  const pidLooksNumeric = /^\d+$/.test(pidRaw);
  const idLooksNumeric = /^\d+$/.test(idRaw);

  const productId = pidLooksNumeric
    ? Number(pidRaw)
    : idLooksNumeric
      ? Number(idRaw)
      : Number.NaN;

  const slugFromIdQuery = idRaw && !idLooksNumeric ? idRaw : "";

  const slugFromParams =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0] || ""
        : "";

  const slugFromPathname = (() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    if (parts[0] !== "products") return "";
    return parts[1] ? safeDecoded(parts[1]) : "";
  })();

  const requestedSlug = safeDecoded(
    (
      slugFromParams ||
      slugFromPathname ||
      searchParams.get("slug") ||
      slugFromIdQuery ||
      ""
    ).trim()
  );

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
            : "Failed to load storefront data."
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

  const product = useMemo(() => {
    if (!storefront) return null;

    if (Number.isFinite(productId)) {
      return storefront.products.find((item) => item.id === productId) || null;
    }

    if (!requestedSlug) return null;

    const normalizedSlug = requestedSlug.toLowerCase();
    return (
      storefront.products.find(
        (item) => productSlugFromName(item.name, item.id) === normalizedSlug
      ) || null
    );
  }, [storefront, productId, requestedSlug]);

  useEffect(() => {
    if (!product || typeof window === "undefined") return;

    const siteName = "Cheat Paradise";
    const siteUrl = window.location.origin;
    const canonicalUrl = `${siteUrl}${productHref(product, { includePidQuery: false })}`;
    const description =
      product.description ||
      `Buy ${product.name} with instant delivery and secure checkout on ${siteName}.`;

    document.title = product.name;
    upsertMeta({ key: "name", value: "description" }, description);
    upsertMeta({ key: "property", value: "og:title" }, product.name);
    upsertMeta({ key: "property", value: "og:description" }, description);
    upsertMeta({ key: "property", value: "og:url" }, canonicalUrl);
    if (product.image) {
      upsertMeta({ key: "property", value: "og:image" }, product.image);
      upsertMeta({ key: "name", value: "twitter:image" }, product.image);
    }
    upsertCanonical(canonicalUrl);
  }, [product]);

  if (loading) {
    return <SubpageSkeleton rows={5} />;
  }

  if (error) {
    return <p className="state-message error" style={{ padding: "20px" }}>{error}</p>;
  }

  const isProductsRoot = pathname === "/products" || pathname === "/products/";

  if (!Number.isFinite(productId) && !requestedSlug && isProductsRoot) {
    return (
      <p className="state-message" style={{ padding: "20px" }}>
        Invalid product link. <Link href="/">Back to store</Link>
      </p>
    );
  }

  if (!product || !storefront) {
    return (
      <p className="state-message" style={{ padding: "20px" }}>
        Product not found. <Link href="/">Back to store</Link>
      </p>
    );
  }

  const siteUrl =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cheatparadise.com";

  const productUrl = `${siteUrl}${productHref(product, { includePidQuery: false })}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Buy ${product.name} with instant delivery on CheatParadise.`,
    sku: String(product.id),
    category: product.categoryName || product.groupName || "Gaming Product",
    image: product.image ? [product.image] : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "USD",
      price: typeof product.price === "number" ? product.price.toFixed(2) : undefined,
      availability:
        typeof product.stock === "number" && product.stock <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: productUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryName || product.groupName || "Category",
        item: `${siteUrl}/categories?slug=${encodeURIComponent(
          (product.categoryName || product.groupName || "category")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        )}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailPage product={product} paymentMethods={storefront.paymentMethods} />
    </>
  );
}
