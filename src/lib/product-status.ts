import { toGameSlug } from "@/lib/game-slug";
import { productSlugFromName } from "@/lib/product-route";
import type { SellAuthProduct } from "@/types/sellauth";

export type StatusKind = "undetected" | "updating" | "detected";

export interface StatusOverride {
  status: StatusKind;
  note?: string | null;
  updated_at?: string;
}

/**
 * Resolving a product's status lives here rather than in the board component
 * because two places need the same answer: the row badge, and the "All Systems
 * Operational" banner above it.
 *
 * The banner used to summarise every key in the override map. That was harmless
 * while the KeyHub feed returned nothing, but the feed indexes all ~150 KeyHub
 * products — so a handful of products we don't even sell being flagged made the
 * banner announce "Some products are detected" over a board of entirely green
 * rows. The summary has to be computed from the products actually shown.
 */

/**
 * Every key a product might be indexed under, most specific first.
 *
 * KeyHub names a product for the game it targets ("Ancient Rust") while our
 * catalogue splits that into product "Ancient" in category "Rust", so the
 * combined "<product>-<game>" form is what resolves most rows.
 */
export function statusLookupKeys(product: SellAuthProduct): string[] {
  const slug = productSlugFromName(product.name, product.id);
  const simpleName = toGameSlug(product.name);
  const groupSlug = toGameSlug(product.groupName || product.categoryName || "");

  const keys = [String(product.id), slug];
  if (groupSlug && simpleName) keys.push(`${simpleName}-${groupSlug}`);
  if (simpleName) keys.push(simpleName);
  if (groupSlug) keys.push(groupSlug);

  return keys.filter(Boolean);
}

export function findStatusOverride(
  product: SellAuthProduct,
  overrides: Record<string, StatusOverride>
): StatusOverride | undefined {
  for (const key of statusLookupKeys(product)) {
    const hit = overrides[key];
    if (hit) return hit;
  }
  return undefined;
}

/**
 * The status shown when nothing real covers a product.
 *
 * This used to guess by scanning the product's own marketing copy for words
 * like "detected", "offline" or "banned". That was never a status — it was a
 * text match on a sales page — and it was wrong in the worst direction:
 * "Arcane Hell Let Loose External" was showing DETECTED on the public board
 * while the KeyHub feed listed it as fine, because prose about detection
 * tripped the pattern.
 *
 * A guess that a product is detected costs a sale and tells a customer
 * something untrue. Undetected is the only defensible default, so absence of
 * data now reads as undetected rather than as a red badge nobody can explain.
 *
 * Real detections are unaffected: the KeyHub feed and the manual overrides in
 * /admin/status both take priority over this, and both are still free to
 * report "detected" — which they should, because that one is true.
 */
export function inferStatusKind(_product: SellAuthProduct): StatusKind {
  return "undetected";
}

export function resolveStatusKind(
  product: SellAuthProduct,
  overrides: Record<string, StatusOverride>
): StatusKind {
  return findStatusOverride(product, overrides)?.status ?? inferStatusKind(product);
}

export function statusLabel(kind: StatusKind): string {
  if (kind === "undetected") return "UNDETECTED";
  if (kind === "detected") return "DETECTED";
  return "UPDATING";
}

/**
 * Overall banner state, derived only from the products on screen.
 */
export function summariseStatuses(
  products: SellAuthProduct[],
  overrides: Record<string, StatusOverride>
): { color: string; label: string } {
  const kinds = products.map((product) => resolveStatusKind(product, overrides));

  if (kinds.includes("detected")) {
    return { color: "#ef4444", label: "Some products are detected" };
  }
  if (kinds.includes("updating")) {
    return { color: "#fbbf24", label: "Some products are updating" };
  }
  return { color: "#43c601", label: "All Systems Operational" };
}
