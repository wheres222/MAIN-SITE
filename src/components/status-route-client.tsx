"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductStatusBoard } from "@/components/product-status-board";
import type { StorefrontData } from "@/types/sellauth";

export function StatusRouteClient() {
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

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="status" />
      <main className="shell subpage-wrap">
        {loading ? <p className="state-message">Loading status...</p> : null}
        {error ? <p className="state-message error">{error}</p> : null}

        {data?.warnings?.length ? (
          <section className="catalog warn-box">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        ) : null}

        {data ? <ProductStatusBoard products={data.products} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
