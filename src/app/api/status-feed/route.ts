import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATIC_STATUS_DEFAULTS } from "@/lib/status-defaults";
import { getKeyhubStatuses, isKeyhubConfigured, type StatusKind } from "@/lib/keyhub";

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

interface StatusEntry {
  product_id: string;
  status: StatusKind;
  note: string | null;
  updated_at: string;
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
    result[slug] = { product_id: slug, status, note: null, updated_at: now };
  }
  return result;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  const [supabaseStatuses, keyhubStatuses] = await Promise.all([
    fetchSupabaseStatuses(),
    getKeyhubStatuses(),
  ]);

  const staticStatuses = buildStaticStatuses();

  // Priority (lowest → highest): static defaults → keyhub → Supabase admin panel
  const statuses: Record<string, StatusEntry> = {
    ...staticStatuses,
    ...keyhubStatuses,
    ...supabaseStatuses,
  };

  if (debug) {
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
