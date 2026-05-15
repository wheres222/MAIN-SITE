import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";
import { gameSeoContentFor } from "@/lib/game-seo-content";

/**
 * Return the best /categories URL for a given game name or slug.
 *
 * If we have authored an SEO landing page for the game, use the clean
 * /categories/<slug> path. Otherwise fall back to the legacy query-param
 * form so anything without a landing page still works.
 *
 * Pointing internal links at the clean URL directly (rather than through
 * the 301 from the query-param form) is itself an SEO signal — Google
 * penalises sites that route internal links through redirects.
 */
export function categoryHref(nameOrSlug: string): string {
  const raw = toGameSlug(nameOrSlug || "");
  if (!raw) return "/categories";

  const canonical = canonicalGameSlug(raw);
  if (gameSeoContentFor(canonical)) {
    return `/categories/${canonical}`;
  }
  return `/categories?slug=${encodeURIComponent(raw)}`;
}
