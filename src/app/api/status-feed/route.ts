import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATIC_STATUS_DEFAULTS } from "@/lib/status-defaults";
import { logger } from "@/lib/logger";
import { denyUnlessRole } from "@/lib/auth/guard";
import { getKeyhubStatusesDetailed, isKeyhubConfigured, type StatusKind } from "@/lib/keyhub";

export const dynamic = "force-dynamic";

/**
 * Unified status feed consumed by the public status board (polls every 60s).
 *
 * Sources (merged, highest priority first):
 *   1. Supabase product_statuses — manual overrides from /admin/status
 *   2. KeyHub /products          — automatic live feed (see @/lib/keyhub)
 *   3. Static defaults           — baseline so the board is never blank
 *
 * Always returns 200. If every source fails the board falls back to
 * auto-inferred statuses (all products show as Undetected).
 */

/**
 * Which layer supplied a status. Surfaced so /admin/status can show where the
 * value the public board is displaying actually came from — without it a manual
 * override and a live KeyHub reading look identical.
 */
export type StatusSource = "default" | "keyhub" | "manual";

interface StatusEntry {
  product_id: string;
  status: StatusKind;
  note: string | null;
  updated_at: string;
  source: StatusSource;
}

// ── Supabase ──────────────────────────────────────────────────────────────────

async function fetchSupabaseStatuses(): Promise<Record<string, StatusEntry>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_statuses")
      .select("product_id, status, note, updated_at");

    if (error || !data) return {};

    const result: Record<string, StatusEntry> = {};
    for (const row of data) {
      if (!row.product_id || !row.status) continue;
      result[String(row.product_id)] = {
        product_id: String(row.product_id),
        status: row.status as StatusKind,
        note: row.note ?? null,
        updated_at: row.updated_at ?? new Date().toISOString(),
        source: "manual",
      };
    }
    return result;
  } catch {
    // Supabase not configured or unavailable
    return {};
  }
}

// ── Static defaults (lowest priority baseline) ────────────────────────────────

function buildStaticStatuses(): Record<string, StatusEntry> {
  const now = new Date().toISOString();
  const result: Record<string, StatusEntry> = {};
  for (const [slug, status] of Object.entries(STATIC_STATUS_DEFAULTS)) {
    result[slug] = { product_id: slug, status, note: null, updated_at: now, source: "default" };
  }
  return result;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  const [supabaseStatuses, keyhub] = await Promise.all([
    fetchSupabaseStatuses(),
    getKeyhubStatusesDetailed(),
  ]);

  const keyhubStatuses = keyhub.statuses;

  // Logged unconditionally, not only under ?debug=1. A silently empty feed
  // means the board is showing inferred statuses rather than real ones, and
  // the only visible symptom is that nothing ever changes.
  if (keyhub.error) {
    logger.warn("KeyHub status feed unavailable", {
      route: "api/status-feed",
      err: keyhub.error,
    });
  }

  const staticStatuses = buildStaticStatuses();

  // Priority (lowest → highest): static defaults → keyhub → Supabase admin panel
  const statuses: Record<string, StatusEntry> = {
    ...staticStatuses,
    ...keyhubStatuses,
    ...supabaseStatuses,
  };

  if (debug) {
    // Staff only. This view names which integrations are configured and now
    // carries the provider's own error text — useful to whoever runs the site,
    // free reconnaissance for anyone else. The board itself stays public.
    const denied = await denyUnlessRole("staff");
    if (denied) return denied;

    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Which KeyHub product produced each key, and the spread of resulting
    // statuses — this is what you check when a board row shows the wrong
    // state: either its key isn't in `keyhub.sample`, or it maps oddly.
    const byStatus: Record<string, number> = {};
    for (const entry of Object.values(keyhubStatuses)) {
      byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
    }

    return NextResponse.json({
      sources: {
        static: { count: Object.keys(staticStatuses).length },
        keyhub: {
          configured: isKeyhubConfigured(),
          error: keyhub.error,
          productsReturned: keyhub.productCount,
          count: Object.keys(keyhubStatuses).length,
          byStatus,
          sample: Object.entries(keyhubStatuses)
            .slice(0, 40)
            .map(([key, entry]) => `${key} → ${entry.status} (${entry.source_name})`),
        },
        supabase: { configured: hasSupabase, count: Object.keys(supabaseStatuses).length },
      },
      merged: statuses,
    });
  }

  return NextResponse.json({ statuses });
}
