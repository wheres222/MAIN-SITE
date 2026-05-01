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
    <div className="marketplace-page" style={{ background: "#0d0d0f", position: "relative", overflow: "hidden" }}>
      <SiteHeader activeTab="status" />

      {/* Ambient background glows — non-invasive, site palette */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute",
          top: "8%", left: "50%",
          transform: "translateX(-50%)",
          width: 700, height: 340,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,120,255,0.09) 0%, rgba(88,101,242,0.06) 50%, transparent 80%)",
          filter: "blur(48px)",
        }} />
        <div style={{
          position: "absolute",
          top: "30%", left: "18%",
          width: 320, height: 320,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(88,101,242,0.07) 0%, transparent 75%)",
          filter: "blur(56px)",
        }} />
        <div style={{
          position: "absolute",
          top: "25%", right: "12%",
          width: 280, height: 280,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,166,255,0.06) 0%, transparent 75%)",
          filter: "blur(52px)",
        }} />
      </div>

      {/* Page header */}
      <header style={{
        position: "relative", zIndex: 1,
        paddingTop: 112, paddingBottom: 36,
        textAlign: "center",
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 700,
          color: "#f0f4ff",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Product Status
        </h1>
        <p style={{
          margin: "10px 0 0",
          fontSize: "0.97rem",
          color: "#5a6478",
          fontWeight: 400,
        }}>
          Realtime status of all products
        </p>
      </header>

      <main style={{ position: "relative", zIndex: 1 }}>
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
