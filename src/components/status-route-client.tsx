"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductStatusBoard } from "@/components/product-status-board";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import { formatStorefrontWarnings } from "@/lib/storefront-warnings";
import type { StorefrontData } from "@/types/sellauth";

export function StatusRouteClient() {
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
            : "Failed to load status board."
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

  const warningMessages = useMemo(
    () => formatStorefrontWarnings(data?.warnings || []),
    [data?.warnings]
  );

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="status" />

      {/* Status page banner */}
      <div className="status-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/status-banner.webp" alt="" className="status-banner-img" aria-hidden="true" />
        <div className="status-banner-overlay" />
      </div>

      <main className="shell subpage-wrap">
        {loading ? <SubpageSkeleton rows={5} /> : null}
        {error ? <p className="state-message error">{error}</p> : null}

        {warningMessages.length ? (
          <section className="catalog warn-box">
            {warningMessages.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        ) : null}

        {data ? (
          <ProductStatusBoard
            products={data.products}
            groups={data.groups}
            categories={data.categories}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
