/**
 * The merged product-status map — SERVER SIDE ONLY.
 *
 * Extracted out of /api/status-feed so the status page can server-render the
 * same answer the client polls for. Previously only the client fetched it, so
 * the first paint fell through to inferStatusKind and every visitor saw a
 * board of guessed statuses that corrected itself a moment later. Anyone on a
 * slow connection, with JS blocked, or crawling the page saw only the guesses.
 *
 * Priority, lowest to highest: static defaults → KeyHub → Supabase admin
 * overrides. A manual override always wins, which is the point of /admin/status.
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATIC_STATUS_DEFAULTS } from "@/lib/status-defaults";
import { getKeyhubStatusesDetailed, type StatusKind } from "@/lib/keyhub";

/** Which layer supplied a status, so /admin/status can show where it came from. */
export type StatusSource = "default" | "keyhub" | "manual";

export interface StatusEntry {
  product_id: string;
  status: StatusKind;
  note: string | null;
  updated_at: string;
  source: StatusSource;
  source_name?: string;
}

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
    // Supabase not configured or unavailable.
    return {};
  }
}

function buildStaticStatuses(): Record<string, StatusEntry> {
  const now = new Date().toISOString();
  const result: Record<string, StatusEntry> = {};
  for (const [slug, status] of Object.entries(STATIC_STATUS_DEFAULTS)) {
    result[slug] = { product_id: slug, status, note: null, updated_at: now, source: "default" };
  }
  return result;
}

export interface MergedStatuses {
  statuses: Record<string, StatusEntry>;
  /** KeyHub's own error text, if it failed. Null on success. */
  keyhubError: string | null;
  keyhubCount: number;
}

export async function getMergedStatuses(): Promise<MergedStatuses> {
  const [supabaseStatuses, keyhub] = await Promise.all([
    fetchSupabaseStatuses(),
    getKeyhubStatusesDetailed(),
  ]);

  const statuses: Record<string, StatusEntry> = {
    ...buildStaticStatuses(),
    ...(keyhub.statuses as Record<string, StatusEntry>),
    ...supabaseStatuses,
  };

  return {
    statuses,
    keyhubError: keyhub.error ?? null,
    keyhubCount: Object.keys(keyhub.statuses ?? {}).length,
  };
}
