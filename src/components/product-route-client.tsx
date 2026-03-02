"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductDetailPage } from "@/components/product-detail-page";
import type { StorefrontData } from "@/types/sellauth";

export function ProductRouteClient() {
  const searchParams = useSearchParams();
  const productIdRaw = searchParams.get("id") || "";
  const productId = Number(productIdRaw);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const response = await fetch("/api/storefront");
        const payload = (await response.json()) as StorefrontData;
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
    if (!storefront || !Number.isFinite(productId)) return null;
    return storefront.products.find((item) => item.id === productId) || null;
  }, [storefront, productId]);

  if (loading) {
    return <p className="state-message" style={{ padding: "20px" }}>Loading product...</p>;
  }

  if (error) {
    return <p className="state-message error" style={{ padding: "20px" }}>{error}</p>;
  }

  if (!Number.isFinite(productId)) {
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

  return <ProductDetailPage product={product} paymentMethods={storefront.paymentMethods} />;
}
