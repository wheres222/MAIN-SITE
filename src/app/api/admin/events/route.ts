import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessRole } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 200;

/**
 * GET /api/admin/events — the security log feed. Owner only.
 *
 * security_events has RLS enabled with no policies, so it is unreachable with
 * the anon key by design; reads go through the service-role client behind this
 * guard rather than through per-row policies.
 */
export async function GET(request: NextRequest) {
  const denied = await denyUnlessRole("owner");
  if (denied) return denied;

  const { searchParams } = request.nextUrl;
  const kind = searchParams.get("kind");
  const severity = searchParams.get("severity");
  const ip = searchParams.get("ip");
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 7), 1), 90);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), MAX_LIMIT);

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const db = createAdminClient();

  let query = db
    .from("security_events")
    .select("*")
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (kind) query = query.eq("kind", kind);
  if (severity) query = query.eq("severity", severity);
  if (ip) query = query.eq("ip", ip);

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Query failed", detail: error.message },
      { status: 500 }
    );
  }

  // Summary is computed over the same window but without the filters, so the
  // counts stay stable while you drill into one kind.
  const { data: window } = await db
    .from("security_events")
    .select("kind, severity, ip")
    .gte("occurred_at", since)
    .limit(5000);

  const byKind: Record<string, number> = {};
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0 };
  const byIp: Record<string, number> = {};

  for (const row of window ?? []) {
    byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
    if (row.severity in bySeverity) bySeverity[row.severity] += 1;
    if (row.ip) byIp[row.ip] = (byIp[row.ip] ?? 0) + 1;
  }

  const topIps = Object.entries(byIp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([address, count]) => ({ ip: address, count }));

  return NextResponse.json({
    events: events ?? [],
    summary: {
      days,
      total: window?.length ?? 0,
      byKind,
      bySeverity,
      topIps,
    },
  });
}
