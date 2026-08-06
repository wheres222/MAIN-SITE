import "server-only";
import { NextResponse, after, type NextRequest } from "next/server";
import {
  clientCountry,
  clientIp,
  noteBurst,
  recordSecurityEvent,
} from "@/lib/security/events";

export const dynamic = "force-dynamic";

/**
 * Client-reported security signals.
 *
 * Password login and registration run browser → Supabase directly
 * (src/components/auth-page.tsx calls supabase.auth.signInWithPassword), so
 * failed attempts never touch this server and are invisible to src/proxy.ts.
 * This endpoint is how those failures get recorded.
 *
 * Everything here is low-trust by definition — anyone can POST to it. So:
 *   - only an allowlisted set of kinds is accepted
 *   - nothing the client sends is used for IP, country or user-agent
 *   - it is rate limited hard, because otherwise it is itself a way to flood
 *     the security_events table
 * Treat the resulting rows as a hint, not as proof.
 */

const ACCEPTED_KINDS = new Set(["auth_failure"]);

const REPORT_WINDOW_MS = 60_000;
const REPORT_MAX = 15;

/** Failed logins from one IP in a 5-minute window before it counts as an attack. */
const AUTH_BURST_THRESHOLD = 8;

interface Bucket {
  count: number;
  start: number;
}

function reportStore(): Map<string, Bucket> {
  const g = globalThis as typeof globalThis & {
    __securityReportRates?: Map<string, Bucket>;
  };
  if (!g.__securityReportRates) g.__securityReportRates = new Map();
  return g.__securityReportRates;
}

function overReportLimit(ip: string, now: number): boolean {
  const store = reportStore();

  for (const [k, v] of store.entries()) {
    if (now - v.start > REPORT_WINDOW_MS * 2) store.delete(k);
  }

  const bucket = store.get(ip);
  if (!bucket || now - bucket.start > REPORT_WINDOW_MS) {
    store.set(ip, { count: 1, start: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > REPORT_MAX;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);

  // Always 204 — this endpoint tells a caller nothing about whether it worked.
  // Confirming that reports are being dropped would just teach an attacker the
  // threshold to stay under.
  const ok = new NextResponse(null, { status: 204 });

  if (!ip) return ok;
  if (overReportLimit(ip, Date.now())) return ok;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ok;
  }

  const kind = (body as { kind?: unknown })?.kind;
  if (typeof kind !== "string" || !ACCEPTED_KINDS.has(kind)) return ok;

  const context = (body as { context?: unknown })?.context;

  after(async () => {
    await recordSecurityEvent({
      kind: "auth_failure",
      severity: "low",
      ip,
      country: clientCountry(request.headers),
      userAgent: request.headers.get("user-agent"),
      method: "POST",
      path: "/login",
      detail: {
        clientReported: true,
        context: typeof context === "string" ? context.slice(0, 100) : null,
      },
    });

    const crossed = noteBurst(`auth:${ip}`, AUTH_BURST_THRESHOLD);
    if (crossed !== null) {
      await recordSecurityEvent({
        kind: "auth_failure_burst",
        severity: "high",
        ip,
        country: clientCountry(request.headers),
        userAgent: request.headers.get("user-agent"),
        path: "/login",
        detail: { failures: crossed, windowMinutes: 5 },
      });
    }
  });

  return ok;
}
