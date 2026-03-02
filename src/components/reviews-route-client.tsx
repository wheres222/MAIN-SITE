"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ReviewsBoard } from "@/components/reviews-board";
import { createMockReviewsFromProducts } from "@/lib/reviews";
import type { StorefrontData } from "@/types/sellauth";

export function ReviewsRouteClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<StorefrontData | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const response = await fetch("/api/storefront");
        const payload = (await response.json()) as StorefrontData;
        if (!alive) return;
        setData(payload);
        setError("");
      } catch (requestError) {
        if (!alive) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load reviews."
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

  const reviews = useMemo(
    () => (data ? createMockReviewsFromProducts(data.products, 16) : []),
    [data]
  );

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="reviews" />
      <main className="shell subpage-wrap">
        {loading ? <p className="state-message">Loading reviews...</p> : null}
        {error ? <p className="state-message error">{error}</p> : null}
        {data ? <ReviewsBoard reviews={reviews} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
