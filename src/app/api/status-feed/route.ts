import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public status feed — server-side proxy to keyhub.club.
 * Keeps the keyhub API key server-only and normalizes keyhub's status values
 * to the board's vocabulary. The status board polls this every ~60s.
 *
 * Required env:  KEYHUB_API_KEY   (kh_… — server only)
 * Optional env:  KEYHUB_API_BASE  (default https://keyhub.club/api/external/status)
 *
 * Returns: { statuses: { [ref]: { product_id, status, note, updated_at } } }
 * Always responds 200 with whatever it has — the board falls back to
 * auto-inferred statuses if the feed is empty/unavailable.
 */

type StatusKind = "undetected" | "updating" | "detected";

// keyhub status value → board status. Adjust the left side once the exact
// values your keyhub panel emits are confirmed.
const STATUS_MAP: Record<string, StatusKind> = {
  operational: "undetected",
  up: "undetected",
  online: "undetected",
  undetected: "undetected",
  degraded: "updating",
  maintenance: "updating",
  partial_outage: "updating",
  partial: "updating",
  updating: "updating",
  testing: "updating",
  down: "detected",
  major_outage: "detected",
  outage: "detected",
  offline: "detected",
  detected: "detected",
};

function mapStatus(raw: unknown): StatusKind | null {
  if (typeof raw !== "string") return null;
  return STATUS_MAP[raw.toLowerCase().trim()] ?? null;
}

interface KeyhubItem {
  external_ref?: string;
  ref?: string;
  id?: string | number;
  name?: string;
  title?: string;
  status?: string;
  message?: string;
  updated_at?: string;
}

function extractItems(payload: unknown): KeyhubItem[] {
  if (Array.isArray(payload)) return payload as KeyhubItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as KeyhubItem[];
    if (Array.isArray(obj.data)) return obj.data as KeyhubItem[];
  }
  return [];
}

interface StatusEntry {
  product_id: string;
  status: StatusKind;
  note: string | null;
  updated_at: string;
}

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const apiKey = process.env.KEYHUB_API_KEY?.trim();
  const base = process.env.KEYHUB_API_BASE?.trim() || "https://keyhub.club/api/external/status";

  if (!apiKey) {
    return NextResponse.json({ statuses: {}, error: "KEYHUB_API_KEY not set" });
  }

  let payload: unknown;
  try {
    // Try the base URL first, then /items as a fallback (keyhub may serve
    // the list at either path depending on account tier/configuration).
    const urlsToTry = [base, `${base}/items`];
    let lastError = "";
    let succeeded = false;

    for (const url of urlsToTry) {
      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
          next: { revalidate: 30 }, // cache keyhub response 30s so polling doesn't hammer it
        });
      } catch (e) {
        lastError = String(e).slice(0, 300);
        continue;
      }

      if (!res.ok) {
        lastError = `keyhub responded ${res.status} at ${url}`;
        continue;
      }

      payload = await res.json();
      const items = extractItems(payload);
      if (items.length > 0 || url === urlsToTry[urlsToTry.length - 1]) {
        succeeded = true;
        break;
      }
    }

    if (!succeeded && !payload) {
      return NextResponse.json({ statuses: {}, error: lastError || "keyhub fetch failed" });
    }
  } catch (e) {
    return NextResponse.json({ statuses: {}, error: "keyhub fetch failed", detail: String(e).slice(0, 300) });
  }

  const items = extractItems(payload);

  if (debug) {
    return NextResponse.json({ itemCount: items.length, raw: payload });
  }

  const statuses: Record<string, StatusEntry> = {};
  const now = new Date().toISOString();

  for (const item of items) {
    const ref = item.external_ref ?? item.ref ?? (item.id != null ? String(item.id) : undefined);
    const kind = mapStatus(item.status);
    if (!ref || !kind) continue;
    statuses[String(ref)] = {
      product_id: String(ref),
      status: kind,
      note: typeof item.message === "string" && item.message ? item.message : null,
      updated_at: item.updated_at ?? now,
    };
  }

  return NextResponse.json({ statuses });
}
