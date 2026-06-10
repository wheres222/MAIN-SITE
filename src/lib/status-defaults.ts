/**
 * Static fallback statuses.
 *
 * These are the LOWEST priority layer — keyhub and the Supabase admin panel
 * override anything set here.  Edit this file and deploy to manually set a
 * game's status when neither keyhub nor Supabase is available.
 *
 * Keys must be canonical game slugs (see src/lib/game-slug.ts):
 *   apex | arc-raiders | call-of-duty | counter-strike-2 | delta-force |
 *   escape-from-tarkov | fortnite | fivem | pubg | rainbow-six-siege |
 *   rocket-league | roblox | rust | valorant | hwid-spoofers
 *
 * Valid values: "undetected" | "updating" | "detected"
 * Leave this object empty to let the board auto-infer from product names.
 */

export type StatusKind = "undetected" | "updating" | "detected";

export const STATIC_STATUS_DEFAULTS: Record<string, StatusKind> = {
  // ── EDIT THESE to push a manual status immediately ──────────────────────
  // "rust":             "undetected",
  // "valorant":         "updating",
  // "call-of-duty":     "detected",
  // ────────────────────────────────────────────────────────────────────────
};
