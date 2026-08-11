import "server-only";
import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";

/**
 * KeyHub product status feed.
 *
 * Endpoint: GET {KEYHUB_API_BASE}/products, auth via `Authorization: Bearer`.
 *
 * Note on endpoints: KeyHub's `POST /key-status` (scope `keys:status`) looks
 * like the obvious fit by name, but it resolves a *single licence key* — it
 * requires a `claim_id` or `key_value` and answers "what is the state of this
 * one key in your account". It cannot report per-product detection status, so
 * it is not what drives the status board. `GET /products` is: every product
 * carries `operationalStatus`, a human `statusLabel`, and `lastUpdatedAt`.
 */

export type StatusKind = "undetected" | "updating" | "detected";

export interface KeyhubVariation {
  id: string;
  label: string;
  durationDays: number;
  priceCredits: number;
  stockCount: number;
}

export interface KeyhubProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Listing state (active/inactive), NOT the detection state. */
  status?: string;
  /** The detection state that matters: operational | maintenance | degraded | use-at-own-risk */
  operationalStatus?: string;
  statusLabel?: string;
  lastUpdatedAt?: string;
  variations?: KeyhubVariation[];
}

/**
 * KeyHub's operational states mapped onto the board's three.
 *
 * "use-at-own-risk" is the judgement call: it means the product works but
 * carries elevated ban risk. Showing it green would be actively harmful to a
 * customer, and there is no amber state on the board, so it maps to "detected".
 * If you would rather it read as available, change it to "updating" here —
 * this map is the only place the decision lives.
 */
const OPERATIONAL_STATUS_MAP: Record<string, StatusKind> = {
  operational: "undetected",
  undetected: "undetected",
  up: "undetected",
  online: "undetected",

  maintenance: "updating",
  updating: "updating",
  degraded: "updating",
  "partial-outage": "updating",
  partial_outage: "updating",
  testing: "updating",

  "use-at-own-risk": "detected",
  use_at_own_risk: "detected",
  detected: "detected",
  down: "detected",
  offline: "detected",
  outage: "detected",
  "major-outage": "detected",
  major_outage: "detected",
};

export function mapOperationalStatus(raw: unknown): StatusKind | null {
  if (typeof raw !== "string") return null;
  const key = raw.toLowerCase().trim();
  return OPERATIONAL_STATUS_MAP[key] ?? OPERATIONAL_STATUS_MAP[key.replace(/[\s_]+/g, "-")] ?? null;
}

export interface KeyhubStatusEntry {
  product_id: string;
  status: StatusKind;
  note: string | null;
  updated_at: string;
  /** Kept for the debug view so mismatches are diagnosable. */
  source_name: string;
  /** Which layer produced this entry, for /admin/status and the debug view. */
  source: "keyhub";
}

export function isKeyhubConfigured(): boolean {
  return Boolean(process.env.KEYHUB_API_KEY?.trim());
}

function apiBase(): string {
  return (
    process.env.KEYHUB_API_BASE?.trim().replace(/\/+$/, "") ||
    "https://keyhub.club/api/external"
  );
}

export async function fetchKeyhubProducts(): Promise<KeyhubProduct[]> {
  const apiKey = process.env.KEYHUB_API_KEY?.trim();
  if (!apiKey) return [];

  const res = await fetch(`${apiBase()}/products`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    // The board polls every 60s; this keeps KeyHub to ~2 calls a minute no
    // matter how many visitors are watching.
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`KeyHub /products responded ${res.status}`);
  }

  const payload = (await res.json()) as { products?: KeyhubProduct[] };
  return Array.isArray(payload.products) ? payload.products : [];
}

/**
 * KeyHub names a product for the game it targets — "Ancient Rust", "Arcane
 * Apex". Our catalogue splits those: a product called "Ancient" inside a
 * category called "Rust". So each KeyHub entry is indexed under every key the
 * board might look it up by, including the combined "<product>-<game>" form
 * that src/components/product-status-board.tsx builds.
 */
function indexKeysFor(product: KeyhubProduct): string[] {
  const keys = new Set<string>();

  const add = (value: string | undefined | null) => {
    const slug = toGameSlug(value || "");
    if (slug) keys.add(slug);
  };

  add(product.slug);
  add(product.name);
  if (product.id) keys.add(String(product.id));

  // "Ancient Rust" also indexes the canonical game slug of its trailing words,
  // so a board row for product "Ancient" in category "Rust" resolves via the
  // combined key the board tries.
  const words = (product.name || "").trim().split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const head = toGameSlug(words.slice(0, i).join(" "));
    const tail = words.slice(i).join(" ");
    const game = canonicalGameSlug(tail);
    if (head && game) keys.add(`${head}-${game}`);
  }

  return [...keys];
}

/**
 * Build the status map the feed merges. Later products win on key collisions,
 * except that a worse status always beats a better one — if any product under
 * a shared key is detected, the shared key reports detected rather than
 * silently showing green because an unrelated sibling is fine.
 */
export function buildKeyhubStatusMap(
  products: KeyhubProduct[]
): Record<string, KeyhubStatusEntry> {
  const severity: Record<StatusKind, number> = {
    undetected: 0,
    updating: 1,
    detected: 2,
  };
  const result: Record<string, KeyhubStatusEntry> = {};
  const now = new Date().toISOString();

  for (const product of products) {
    const kind = mapOperationalStatus(product.operationalStatus);
    if (!kind) continue;

    const entry: KeyhubStatusEntry = {
      product_id: "",
      status: kind,
      note: product.statusLabel ?? null,
      updated_at: product.lastUpdatedAt || now,
      source_name: product.name,
      source: "keyhub",
    };

    for (const key of indexKeysFor(product)) {
      const existing = result[key];
      if (existing && severity[existing.status] >= severity[kind]) continue;
      result[key] = { ...entry, product_id: key };
    }
  }

  return result;
}

export async function getKeyhubStatuses(): Promise<Record<string, KeyhubStatusEntry>> {
  if (!isKeyhubConfigured()) return {};
  try {
    return buildKeyhubStatusMap(await fetchKeyhubProducts());
  } catch {
    // The board must keep rendering from Supabase + static defaults.
    return {};
  }
}
