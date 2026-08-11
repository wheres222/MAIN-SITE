import { createAdminClient } from "@/lib/supabase/admin";

/**
 * IP blocklist, held in memory and refreshed on an interval.
 *
 * src/proxy.ts runs on every request, so this cannot be a database read per
 * hit — that would put a Supabase round trip in front of every page view. The
 * snapshot is refreshed at most once a REFRESH_MS window and served from memory
 * in between, which means a newly blocked IP takes up to that long to take
 * effect. That is the right trade: blocking is a deliberate action against a
 * persistent source, not something that needs to land inside a second.
 *
 * Per-instance, like the rate limiter — each serverless instance keeps its own
 * copy and warms it independently.
 */

const REFRESH_MS = 60_000;

interface Snapshot {
  ips: Set<string>;
  at: number;
}

function store(): { snapshot?: Snapshot; inflight?: Promise<void> } {
  const g = globalThis as typeof globalThis & {
    __securityBlocklist?: { snapshot?: Snapshot; inflight?: Promise<void> };
  };
  if (!g.__securityBlocklist) g.__securityBlocklist = {};
  return g.__securityBlocklist;
}

async function refresh(): Promise<void> {
  const state = store();
  try {
    const db = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await db
      .from("security_blocklist")
      .select("ip, expires_at")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    if (error) throw new Error(error.message);

    state.snapshot = {
      ips: new Set((data ?? []).map((row) => String(row.ip))),
      at: Date.now(),
    };
  } catch {
    // Fail open. A blocklist we cannot read must not take the site down —
    // refusing every visitor because Supabase blipped would be a far worse
    // outcome than briefly admitting someone we meant to block. Keep any
    // previous snapshot and mark it fresh so we retry on the next window.
    const existing = store().snapshot;
    state.snapshot = { ips: existing?.ips ?? new Set(), at: Date.now() };
  }
}

/**
 * True when the IP is blocked. Never throws, and never blocks the request on a
 * cold cache: the first caller kicks off a refresh and is allowed through, so
 * a cold start does not pay a Supabase round trip before serving its first page.
 */
export function isBlocked(ip: string | null): boolean {
  if (!ip) return false;

  const state = store();
  const snapshot = state.snapshot;
  const stale = !snapshot || Date.now() - snapshot.at > REFRESH_MS;

  if (stale && !state.inflight) {
    state.inflight = refresh().finally(() => {
      state.inflight = undefined;
    });
  }

  return snapshot ? snapshot.ips.has(ip) : false;
}

/** Drop the cached snapshot so the next request re-reads immediately. */
export function invalidateBlocklist(): void {
  store().snapshot = undefined;
}
