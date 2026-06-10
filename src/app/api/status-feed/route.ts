import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATIC_STATUS_DEFAULTS } from "@/lib/status-defaults";

export const dynamic = "force-dynamic";

/**
 * Unified status feed consumed by the public status board (polls every 60s).
 *
 * Sources (merged, highest priority first):
 *   1. Supabase product_statuses — set via /admin/status panel
 *   2. Keyhub.club external API  — optional live feed
 *
 * Always returns 200. If both sources fail the board falls back to
 * auto-inferred statuses (all products show as Undetected).
 */

type StatusKind = "undetected" | "updating" | "detected";

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

// ── Keyhub ────────────────────────────────────────────────────────────────────

const KEYHUB_STATUS_MAP: Record<string, StatusKind> = {
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

function mapKeyhubStatus(raw: unknown): StatusKind | null {
  if (typeof raw !== "string") return null;
  return KEYHUB_STATUS_MAP[raw.toLowerCase().trim()] ?? null;
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

function extractKeyhubItems(payload: unknown): KeyhubItem[] {
  if (Array.isArray(payload)) return payload as KeyhubItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as KeyhubItem[];
    if (Array.isArray(obj.data)) return obj.data as KeyhubItem[];
    if (Array.isArray(obj.statuses)) return obj.statuses as KeyhubItem[];
  }
  return [];
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchKeyhubStatuses(): Promise<Record<string, StatusEntry>> {
  const apiKey = process.env.KEYHUB_API_KEY?.trim();
  const base = process.env.KEYHUB_API_BASE?.trim() || "https://keyhub.club/api/external/status";
  if (!apiKey) return {};

  const headers: Record<string, string> = {
    // Keyhub uses X-Api-Key, not Bearer
    "X-Api-Key": apiKey,
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };

  const urlsToTry = [base, `${base}/items`];
  const now = new Date().toISOString();

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers,
        next: { revalidate: 30 },
      });
      if (!res.ok) continue;

      const payload = await res.json();
      const items = extractKeyhubItems(payload);
      if (items.length === 0) continue;

      const result: Record<string, StatusEntry> = {};
      for (const item of items) {
        const kind = mapKeyhubStatus(item.status);
        if (!kind) continue;

        const entry: StatusEntry = {
          product_id: "",
          status: kind,
          note: typeof item.message === "string" && item.message ? item.message : null,
          updated_at: item.updated_at ?? now,
        };

        // Key by every available identifier so the board can match by whichever it has
        const ids = new Set<string>();
        if (item.external_ref) ids.add(String(item.external_ref));
        if (item.ref) ids.add(String(item.ref));
        if (item.id != null) ids.add(String(item.id));
        if (item.name) ids.add(slugify(item.name));
        if (item.title) ids.add(slugify(item.title));

        for (const id of ids) {
          result[id] = { ...entry, product_id: id };
        }
      }
      return result;
    } catch {
      continue;
    }
  }

  return {};
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
    fetchKeyhubStatuses(),
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
    const hasKeyhub = !!process.env.KEYHUB_API_KEY?.trim();
    return NextResponse.json({
      sources: {
        static: { count: Object.keys(staticStatuses).length },
        keyhub: { configured: hasKeyhub, count: Object.keys(keyhubStatuses).length },
        supabase: { configured: hasSupabase, count: Object.keys(supabaseStatuses).length },
      },
      merged: statuses,
    });
  }

  return NextResponse.json({ statuses });
}
