"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductDetailPage } from "@/components/product-detail-page";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import {
  findProductByRoute,
  productDisplayName,
  productHref,
  productSeoTitle,
  productSlugFromName,
} from "@/lib/product-route";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
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

interface ProductRouteClientProps {
  initialData?: StorefrontData | null;
}

export function ProductRouteClient({ initialData }: ProductRouteClientProps = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams<{ game?: string | string[]; slug?: string | string[] }>();
  const router = useRouter();

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

  // URLs are /products/{game}/{product}; the product is the third segment.
  // Before the game segment existed it was the second, so a two-part path is
  // read as a bare product slug and still resolves.
  const slugFromPathname = (() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    if (parts[0] !== "products") return "";
    const leaf = parts[2] || parts[1] || "";
    return leaf ? safeDecoded(leaf) : "";
  })();

  const gameFromParams =
    typeof params?.game === "string"
      ? params.game
      : Array.isArray(params?.game)
        ? params.game[0] || ""
        : "";

  const requestedGame = safeDecoded(
    (
      gameFromParams ||
      ((pathname || "").split("/").filter(Boolean)[0] === "products" &&
      (pathname || "").split("/").filter(Boolean).length > 2
        ? (pathname || "").split("/").filter(Boolean)[1]
        : "") ||
      ""
    ).trim()
  );

  const requestedSlug = safeDecoded(
    (
      slugFromParams ||
      slugFromPathname ||
      searchParams.get("slug") ||
      slugFromIdQuery ||
      ""
    ).trim()
  );

  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [storefront, setStorefront] = useState<StorefrontData | null>(initialData ?? null);

  // Prime the client-side cache from server data so subsequent navigations
  // within the same session don't re-fetch.
  useEffect(() => {
    if (initialData) primeStorefrontCache(initialData);
  }, [initialData]);

  useEffect(() => {
    // Skip client fetch — server already provided the data.
    if (initialData) return;

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
  }, [initialData]);

  const product = useMemo(() => {
    if (!storefront) return null;

    if (Number.isFinite(productId)) {
      return storefront.products.find((item) => item.id === productId) || null;
    }

    if (!requestedSlug) return null;

    const normalizedSlug = requestedSlug.toLowerCase();

    // Game + leaf is the canonical form and disambiguates products that share
    // a name across games — an "Ancient" for Rust and one for Arc Raiders.
    if (requestedGame) {
      const byRoute = findProductByRoute(
        storefront.products,
        requestedGame,
        normalizedSlug
      );
      if (byRoute) return byRoute;
    }

    // Bare slug: a pre-restructure link, or a product whose name is unique.
    return (
      storefront.products.find(
        (item) => productSlugFromName(item.name, item.id) === normalizedSlug
      ) || null
    );
  }, [storefront, productId, requestedSlug, requestedGame]);

  useEffect(() => {
    if (!product || typeof window === "undefined") return;

    const siteName = "Cheat Paradise";
    const siteUrl = window.location.origin;
    const canonicalUrl = `${siteUrl}${productHref(product)}`;
    const description =
      product.description ||
      `Buy ${product.name} with instant delivery and secure checkout on ${siteName}.`;

    document.title = productSeoTitle(product);
    upsertMeta({ key: "name", value: "description" }, description);
    upsertMeta({ key: "property", value: "og:title" }, productDisplayName(product));
    upsertMeta({ key: "property", value: "og:description" }, description);
    upsertMeta({ key: "property", value: "og:url" }, canonicalUrl);
    if (product.image) {
      upsertMeta({ key: "property", value: "og:image" }, product.image);
      upsertMeta({ key: "name", value: "twitter:image" }, product.image);
    }
    upsertCanonical(canonicalUrl);
  }, [product]);

  // Redirect legacy ?id= and ?pid= URLs to clean slug paths
  useEffect(() => {
    if (!product) return;
    const hasLegacyParam = searchParams.has("id") || searchParams.has("pid");
    if (hasLegacyParam) {
      router.replace(productHref(product));
    }
  }, [product, searchParams, router]);

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

  // JSON-LD schemas are emitted server-side from src/app/products/[slug]/page.tsx
  // via buildProductSchemas() — see src/lib/product-schemas.ts. Don't duplicate
  // them here or Googlebot will see two copies and the canonical product
  // schema spec disallows that.

  return (
    <ProductDetailPage product={product} paymentMethods={storefront.paymentMethods} />
  );
}
