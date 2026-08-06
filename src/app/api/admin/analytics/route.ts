import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { denyUnlessRole } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics — visitor stats, read from PostHog.
 *
 * PostHog already receives pageviews from src/components/posthog-provider.tsx,
 * so this queries what is there rather than duplicating collection. The key
 * used here is a *personal* API key with read scope — deliberately distinct
 * from NEXT_PUBLIC_POSTHOG_KEY, which is a write-only ingest key that ships to
 * the browser. This one must never reach the client, hence the server route.
 *
 * Caveat worth remembering when reading these numbers: PostHog is client-side
 * JavaScript, so it counts humans with JS enabled. Bots, scanners and curl do
 * not appear here — they appear in /api/admin/events.
 */

const CACHE_TTL_MS = 5 * 60_000;

interface CacheEntry {
  at: number;
  payload: unknown;
}

function cache(): Map<string, CacheEntry> {
  const g = globalThis as typeof globalThis & {
    __analyticsCache?: Map<string, CacheEntry>;
  };
  if (!g.__analyticsCache) g.__analyticsCache = new Map();
  return g.__analyticsCache;
}

async function hogql(query: string): Promise<unknown[]> {
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com")
    .replace("//us.i.", "//us.")
    .replace("//eu.i.", "//eu.")
    .replace(/\/$/, "");
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });

  if (!res.ok) {
    throw new Error(`PostHog ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as { results?: unknown[] };
  return json.results ?? [];
}

export async function GET(request: NextRequest) {
  const denied = await denyUnlessRole("staff");
  if (denied) return denied;

  if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) {
    return NextResponse.json({
      configured: false,
      message:
        "Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to show visitor stats.",
    });
  }

  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days") ?? 7), 1), 90);
  const key = `analytics:${days}`;

  const hit = cache().get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.payload);
  }

  try {
    const [totals, daily, topPages, topReferrers] = await Promise.all([
      hogql(`
        SELECT count() AS pageviews, count(DISTINCT person_id) AS visitors
        FROM events
        WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
      `),
      hogql(`
        SELECT toDate(timestamp) AS day,
               count() AS pageviews,
               count(DISTINCT person_id) AS visitors
        FROM events
        WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
        GROUP BY day ORDER BY day
      `),
      hogql(`
        SELECT properties.$pathname AS path, count() AS views
        FROM events
        WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
        GROUP BY path ORDER BY views DESC LIMIT 15
      `),
      hogql(`
        SELECT properties.$referring_domain AS source, count() AS views
        FROM events
        WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
        GROUP BY source ORDER BY views DESC LIMIT 10
      `),
    ]);

    const first = totals[0] as [number, number] | undefined;

    const payload = {
      configured: true,
      days,
      pageviews: first?.[0] ?? 0,
      visitors: first?.[1] ?? 0,
      daily: (daily as [string, number, number][]).map(([day, pageviews, visitors]) => ({
        day,
        pageviews,
        visitors,
      })),
      topPages: (topPages as [string, number][]).map(([path, views]) => ({ path, views })),
      topReferrers: (topReferrers as [string, number][]).map(([source, views]) => ({
        source: source || "direct",
        views,
      })),
    };

    cache().set(key, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "PostHog query failed",
      },
      { status: 502 }
    );
  }
}
