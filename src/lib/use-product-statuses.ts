"use client";

import { useEffect, useState } from "react";
import type { StatusOverride } from "@/lib/product-status";

/**
 * Live product statuses, shared by every surface that shows one.
 *
 * The status board polled `/api/status-feed` inline in its own component,
 * which meant the product page and the category listing had no way to show a
 * real status and both hardcoded "Undetected" instead — a product could be
 * mid-update, or detected, and still be advertised as safe right up to the
 * moment of purchase.
 *
 * Resolution stays in @/lib/product-status; this only supplies the map.
 *
 * Failure is deliberately silent: callers fall back to inferStatusKind, which
 * answers "undetected". A feed outage should not paint the whole catalogue
 * red, and it must not block the page from rendering.
 */
export function useProductStatuses(
  initial: Record<string, StatusOverride> = {}
): Record<string, StatusOverride> {
  const [statuses, setStatuses] =
    useState<Record<string, StatusOverride>>(initial);

  useEffect(() => {
    let alive = true;

    async function pull() {
      try {
        const res = await fetch("/api/status-feed", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          statuses?: Record<string, StatusOverride>;
        };
        if (alive && json?.statuses) setStatuses(json.statuses);
      } catch {
        // Feed unavailable — caller keeps whatever it already had.
      }
    }

    pull();
    // Same cadence as the status board, so the two never disagree for long.
    const id = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return statuses;
}
