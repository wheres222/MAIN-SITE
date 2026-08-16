import { createAdminClient } from "@/lib/supabase/admin";
import { sendSecurityAlert } from "@/lib/alerts";
import type { Detection, EventKind, Severity } from "./detect";

/**
 * Writes security events to Supabase.
 *
 * Non-negotiable property: this module never throws into a request path and
 * never blocks a response. Telemetry breaking the site would be a worse outcome
 * than losing telemetry, so every failure here is swallowed and logged.
 */

export interface SecurityEventInput {
  kind: EventKind;
  severity: Severity;
  ip?: string | null;
  country?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  query?: string | null;
  userId?: string | null;
  statusCode?: number | null;
  detail?: Record<string, unknown>;
}

function loggingEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Vercel terminates TLS upstream, so the socket address is a proxy. The real
 * client is the first entry of x-forwarded-for. NextRequest.ip was removed in
 * Next 15, hence reading headers directly.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return headers.get("x-real-ip")?.trim().slice(0, 64) ?? null;
}

export function clientCountry(headers: Headers): string | null {
  // Vercel and Cloudflare both set one of these.
  return (
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? null
  );
}

/** Salted so the hash column isn't a rainbow-table lookup of the IPv4 space. */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.SECURITY_IP_SALT ?? "cp-default-salt";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function recordSecurityEvent(
  event: SecurityEventInput
): Promise<void> {
  if (!loggingEnabled()) return;

  try {
    const db = createAdminClient();
    const ip = event.ip ?? null;

    // Same trap as linkAccountIp: supabase-js resolves with an `error` field
    // instead of rejecting, so an insert that fails on a missing column or an
    // RLS policy would have looked like a success to the try/catch below.
    const { error } = await db.from("security_events").insert({
      kind: event.kind,
      severity: event.severity,
      ip,
      ip_hash: ip ? await hashIp(ip) : null,
      country: event.country ?? null,
      user_agent: event.userAgent?.slice(0, 500) ?? null,
      method: event.method ?? null,
      path: event.path?.slice(0, 500) ?? null,
      query: event.query?.slice(0, 500) ?? null,
      user_id: event.userId ?? null,
      status_code: event.statusCode ?? null,
      detail: event.detail ?? {},
    });

    if (error) throw new Error(error.message);

    if (event.severity === "high") {
      await sendSecurityAlert({
        kind: event.kind,
        ip,
        path: event.path ?? null,
        detail: event.detail ?? {},
      });
    }
  } catch (err) {
    // Deliberately silent to the caller. console rather than the structured
    // logger because this also runs on the edge runtime in src/proxy.ts.
    console.error("[security] failed to record event", {
      kind: event.kind,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Note that an account was seen from an address. Upsert via RPC so concurrent
 * requests from the same account cannot lose a hit to a read-modify-write race.
 * Silent on failure for the same reason as recordSecurityEvent: telemetry must
 * never break a page load.
 */
export async function linkAccountIp(userId: string, ip: string): Promise<void> {
  if (!loggingEnabled()) return;
  try {
    const db = createAdminClient();
    const { error } = await db.rpc("touch_account_ip", {
      p_user_id: userId,
      p_ip: ip,
    });
    // Supabase returns RPC failures in `error` rather than throwing, so the
    // old bare try/catch could not see the most likely failure of all: the
    // function not existing because moderation_and_ip_blocking.sql was never
    // applied. Every signed-in request called it, every call failed, and the
    // only symptom was an account-IP table that stayed empty forever.
    if (error) throw new Error(error.message);
  } catch (err) {
    // Still non-fatal — telemetry must never break a page load — but no longer
    // invisible. Throttled because this runs on every authenticated request and
    // an unthrottled log would bury everything else.
    warnOccasionally("account-ip", "failed to link account to IP", err);
  }
}

// ── Throttled warnings ───────────────────────────────────────────────────────
//
// Follows the globalThis pattern used by the rate limiter and the blocklist
// snapshot: per-instance, no storage, and safe on the edge runtime where the
// structured logger is unavailable.

const WARN_INTERVAL_MS = 5 * 60_000;

function warnStore(): Record<string, number> {
  const g = globalThis as typeof globalThis & {
    __securityWarnAt?: Record<string, number>;
  };
  if (!g.__securityWarnAt) g.__securityWarnAt = {};
  return g.__securityWarnAt;
}

function warnOccasionally(key: string, message: string, err: unknown): void {
  const store = warnStore();
  const now = Date.now();
  if (store[key] && now - store[key] < WARN_INTERVAL_MS) return;
  store[key] = now;

  console.warn("[security] " + message, {
    error: err instanceof Error ? err.message : String(err),
    hint: "If this reads like a missing function or relation, apply supabase/migrations/moderation_and_ip_blocking.sql",
  });
}

export async function recordDetections(
  detections: Detection[],
  context: Omit<SecurityEventInput, "kind" | "severity" | "detail">
): Promise<void> {
  for (const detection of detections) {
    await recordSecurityEvent({
      ...context,
      kind: detection.kind,
      severity: detection.severity,
      detail: detection.detail,
    });
  }
}

// ── Burst tracking ───────────────────────────────────────────────────────────
//
// Counters live in module memory, following the same globalThis pattern the
// checkout rate limiter already uses (src/app/api/checkout/route.ts). The same
// caveat applies: on Vercel each instance counts separately and cold starts
// reset the window, so these thresholds catch a burst from one attacker against
// one instance — not a slow distributed sweep. The persisted events in
// security_events are the durable record; this is only about when to escalate.

interface Burst {
  count: number;
  first: number;
  last: number;
}

function burstStore(): Map<string, Burst> {
  const g = globalThis as typeof globalThis & {
    __securityBurstStore?: Map<string, Burst>;
  };
  if (!g.__securityBurstStore) g.__securityBurstStore = new Map();
  return g.__securityBurstStore;
}

const BURST_WINDOW_MS = 5 * 60_000;

/**
 * Records a hit and reports whether it crossed the threshold. Returns the count
 * at the moment of crossing so the caller can include it, and only returns
 * non-null once per window — otherwise every subsequent hit would re-alert.
 */
export function noteBurst(
  key: string,
  threshold: number,
  now = Date.now()
): number | null {
  const store = burstStore();

  for (const [k, v] of store.entries()) {
    if (now - v.last > BURST_WINDOW_MS * 2) store.delete(k);
  }

  const existing = store.get(key);
  if (!existing || now - existing.first > BURST_WINDOW_MS) {
    store.set(key, { count: 1, first: now, last: now });
    return null;
  }

  existing.count += 1;
  existing.last = now;

  return existing.count === threshold ? existing.count : null;
}
