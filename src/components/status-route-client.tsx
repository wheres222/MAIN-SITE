"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductStatusBoard } from "@/components/product-status-board";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import { formatStorefrontWarnings } from "@/lib/storefront-warnings";
import type { StorefrontData } from "@/types/sellauth";

interface StatusOverride {
  product_id: string;
  status: "undetected" | "updating" | "detected";
  note?: string | null;
  updated_at: string;
}

interface StatusRouteClientProps {
  initialData?: StorefrontData | null;
}

export function StatusRouteClient({ initialData }: StatusRouteClientProps) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [data, setData] = useState<StorefrontData | null>(initialData ?? null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, StatusOverride>
  >({});

  // Seed client-side cache with SSR data so subsequent navigations are instant
  useEffect(() => {
    if (initialData) primeStorefrontCache(initialData);
  }, [initialData]);

  // Load storefront data (only runs when SSR data wasn't available)
  useEffect(() => {
    if (initialData) return;
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
  }, [initialData]);

  // Load status overrides + subscribe to realtime changes
  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    supabase
      .from("product_statuses")
      .select("product_id, status, note, updated_at")
      .then(({ data: rows }) => {
        if (!rows) return;
        const map: Record<string, StatusOverride> = {};
        rows.forEach((row) => {
          map[row.product_id] = row as StatusOverride;
        });
        setStatusOverrides(map);
      });

    // Realtime — push changes to all open tabs instantly
    const channel = supabase
      .channel("product-statuses-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_statuses" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { product_id?: string })
              .product_id;
            if (deletedId) {
              setStatusOverrides((prev) => {
                const next = { ...prev };
                delete next[deletedId];
                return next;
              });
            }
          } else {
            const row = payload.new as StatusOverride;
            setStatusOverrides((prev) => ({
              ...prev,
              [row.product_id]: row,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        <img
          src="/branding/status-banner.webp"
          alt=""
          className="status-banner-img"
          aria-hidden="true"
        />
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
            statusOverrides={statusOverrides}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
