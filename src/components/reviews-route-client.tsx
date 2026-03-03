"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ReviewsBoard } from "@/components/reviews-board";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { createMockReviewsFromProducts } from "@/lib/reviews";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { StorefrontData } from "@/types/sellauth";

export function ReviewsRouteClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<StorefrontData | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const payload = await fetchStorefrontClient();
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
    () => (data ? createMockReviewsFromProducts(data.products, 36) : []),
    [data]
  );

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="reviews" />
      <main className="shell subpage-wrap">
        {loading ? <SubpageSkeleton rows={8} /> : null}
        {error ? <p className="state-message error">{error}</p> : null}
        {data ? <ReviewsBoard reviews={reviews} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
