"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductStatusBoard } from "@/components/product-status-board";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import { formatStorefrontWarnings } from "@/lib/storefront-warnings";
import { mockStorefrontData } from "@/lib/mock-data";
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

  // Load status overrides + subscribe to realtime changes (falls back to polling if WS unavailable)
  useEffect(() => {
    const supabase = createClient();
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchOverrides() {
      const { data: rows } = await supabase
        .from("product_statuses")
        .select("product_id, status, note, updated_at");
      if (!rows) return;
      const map: Record<string, StatusOverride> = {};
      rows.forEach((row) => { map[row.product_id] = row as StatusOverride; });
      setStatusOverrides(map);
    }

    // Initial fetch
    fetchOverrides();

    // Try realtime WebSocket; fall back to 15-second polling if unavailable
    try {
      channel = supabase
        .channel("product-statuses-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "product_statuses" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { product_id?: string }).product_id;
              if (deletedId) {
                setStatusOverrides((prev) => {
                  const next = { ...prev };
                  delete next[deletedId];
                  return next;
                });
              }
            } else {
              const row = payload.new as StatusOverride;
              setStatusOverrides((prev) => ({ ...prev, [row.product_id]: row }));
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || err) {
            // WebSocket failed — fall back to polling
            pollInterval = setInterval(fetchOverrides, 15_000);
          }
        });
    } catch {
      // WebSocket not available at all — just poll
      pollInterval = setInterval(fetchOverrides, 15_000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const warningMessages = useMemo(
    () => formatStorefrontWarnings(data?.warnings || []),
    [data?.warnings]
  );

  // Fall back to mock catalog if SellAuth is unreachable so the board always renders
  const displayData = data ?? (!loading ? mockStorefrontData : null);

  return (
    <div className="marketplace-page" style={{ background: "#0d0d0f" }}>
      <SiteHeader activeTab="status" />

      {/* Page header */}
      <header style={{
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

      <main>
        {loading ? <SubpageSkeleton rows={5} /> : null}

        {displayData ? (
          <ProductStatusBoard
            products={displayData.products}
            groups={displayData.groups}
            categories={displayData.categories}
            statusOverrides={statusOverrides}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
