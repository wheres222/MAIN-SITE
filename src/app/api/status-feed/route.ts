import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { denyUnlessRole } from "@/lib/auth/guard";
import { isKeyhubConfigured } from "@/lib/keyhub";
import { getMergedStatuses, type StatusEntry, type StatusSource } from "@/lib/status-feed";

export const dynamic = "force-dynamic";

/**
 * Unified status feed consumed by the public status board (polls every 60s).
 *
 * The merge itself lives in @/lib/status-feed so /status can server-render the
 * same answer this returns. It used to live here, which meant only the client
 * could get it — and the first paint fell through to inferStatusKind, showing
 * guessed statuses until the poll landed.
 *
 * Sources (merged, highest priority first):
 *   1. Supabase product_statuses — manual overrides from /admin/status
 *   2. KeyHub /products          — automatic live feed (see @/lib/keyhub)
 *   3. Static defaults           — baseline so the board is never blank
 *
 * Always returns 200.
 */

export type { StatusSource, StatusEntry };

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  const { statuses, keyhubError, keyhubCount } = await getMergedStatuses();

  // Logged unconditionally, not only under ?debug=1. A silently empty feed
  // means the board is showing inferred statuses rather than real ones, and
  // the only visible symptom is that nothing ever changes.
  if (keyhubError) {
    logger.warn("KeyHub status feed unavailable", {
      route: "api/status-feed",
      err: keyhubError,
    });
  }

  if (debug) {
    // Staff only. This view names which integrations are configured and
    // carries the provider's own error text — useful to whoever runs the site,
    // free reconnaissance for anyone else. The board itself stays public.
    const denied = await denyUnlessRole("staff");
    if (denied) return denied;

    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // The spread of merged statuses and which layer supplied each — this is
    // what you check when a board row shows the wrong state.
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const entry of Object.values(statuses)) {
      byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
    }

    return NextResponse.json({
      sources: {
        keyhub: {
          configured: isKeyhubConfigured(),
          error: keyhubError,
          count: keyhubCount,
        },
        supabase: { configured: hasSupabase },
      },
      byStatus,
      bySource,
      sample: Object.entries(statuses)
        .slice(0, 40)
        .map(([key, entry]) => `${key} → ${entry.status} (${entry.source})`),
      merged: statuses,
    });
  }

  return NextResponse.json({ statuses });
}
