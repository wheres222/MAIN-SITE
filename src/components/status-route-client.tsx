"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductStatusBoard } from "@/components/product-status-board";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import { mockStorefrontData } from "@/lib/mock-data";
import { summariseStatuses } from "@/lib/product-status";
import type { StorefrontData } from "@/types/sellauth";

interface StatusOverride {
  product_id: string;
  status: "undetected" | "updating" | "detected";
  note?: string | null;
  updated_at: string;
}

interface StatusRouteClientProps {
  initialData?: StorefrontData | null;
  /** Server-rendered statuses, so the first paint is already correct. The
   *  60s poll below keeps them fresh from there. */
  initialStatuses?: Record<string, StatusOverride>;
  /**
   * Server-rendered editorial block, passed in rather than imported, so the
   * long-form copy stays out of this client bundle and lands in the initial
   * HTML. Same arrangement as GameCatalogPage's seoFooter.
   */
  seoFooter?: React.ReactNode;
}

export function StatusRouteClient({ initialData, initialStatuses, seoFooter }: StatusRouteClientProps) {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [data, setData] = useState<StorefrontData | null>(initialData ?? null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, StatusOverride>
  >(initialStatuses ?? {});

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

  // Poll the keyhub-backed status feed (server proxy). No Supabase — keyhub is
  // the single source of truth. Updates appear within ~60s while the page is open
  // and immediately on load/refresh.
  useEffect(() => {
    let alive = true;

    async function pull() {
      try {
        const res = await fetch("/api/status-feed", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { statuses?: Record<string, StatusOverride> };
        if (alive && json?.statuses) setStatusOverrides(json.statuses);
      } catch {
        // Feed unavailable — board falls back to auto-inferred statuses
      }
    }

    pull();
    const id = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Fall back to mock catalog if SellAuth is unreachable so the board always renders
  const displayData = data ?? (!loading ? mockStorefrontData : null);

  // Summarised over the products actually on the board, not over every key in
  // the override map — the KeyHub feed indexes its whole catalogue, most of
  // which we don't sell, so summarising the map made the banner report
  // detections that appear nowhere on screen.
  const summary = useMemo(
    () => summariseStatuses(displayData?.products ?? [], statusOverrides),
    [displayData?.products, statusOverrides]
  );

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="status" />

      <main>
        <div style={{ width: "min(820px, calc(100% - 32px))", margin: "0 auto", paddingTop: 32 }}>
          {/* Page header */}
          <header style={{ textAlign: "center", marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1.1 }}>
              Product Status
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>
              Live detection status for every product — updated in real time.
            </p>
          </header>

          {/* Live system-status summary panel */}
          <section className="panel" style={{ marginBottom: 22 }}>
            <div className="panel-body" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: summary.color, boxShadow: `0 0 8px ${summary.color}`,
                flex: "0 0 auto",
              }} />
              <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-brand)", fontWeight: 600, fontSize: "0.95rem" }}>
                {summary.label}
              </strong>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-dim)" }}>
                Auto-refreshing
              </span>
            </div>
          </section>
        </div>

        {/* On failure the board falls back to the demo catalogue, so without
            this a visitor sees placeholder products presented as real ones. */}
        {error ? (
          <div style={{ width: "min(820px, calc(100% - 32px))", margin: "0 auto 18px" }}>
            <p
              style={{
                margin: 0,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239,27,53,0.1)",
                border: "1px solid rgba(239,27,53,0.32)",
                color: "#ff8a9f",
                fontSize: "0.82rem",
              }}
            >
              Live catalogue unavailable — showing a placeholder list. Statuses
              below may not reflect the products we currently sell.
            </p>
          </div>
        ) : null}

        {loading ? <SubpageSkeleton rows={5} /> : null}

        {displayData ? (
          <ProductStatusBoard
            products={displayData.products}
            groups={displayData.groups}
            categories={displayData.categories}
            statusOverrides={statusOverrides}
          />
        ) : null}

        {seoFooter}
      </main>
      <SiteFooter />
    </div>
  );
}
