/**
 * The affiliate programme's real terms, in one place.
 *
 * Both the signed-in dashboard (/account/referrals) and the public recruitment
 * pages (/affiliates) read from here. They previously could not have disagreed
 * because only one of them existed; now that both do, a duplicated tier table
 * would drift the moment rates changed, and a recruitment page advertising a
 * rate the dashboard does not pay is worse than having no recruitment page.
 */

export interface AffiliateTier {
  name: string;
  /** Percentage of each referred order paid to the referrer. */
  kickback: string;
  /** Lifetime referred revenue, in USD, required to reach this tier. */
  threshold: number;
}

/**
 * Rates were 1%–3%, against a 10%–20% norm for this niche. At that level the
 * programme recruited nobody: a creator comparing offers sees the number before
 * anything else, and 1% reads as not worth the effort — which it is.
 *
 * These must stay in step with referral_rate_for() in
 * supabase/migrations/referral_commissions.sql. That function is what actually
 * pays; this table is only what the pages display. If they disagree, the site
 * is advertising a rate it does not honour.
 */
export const AFFILIATE_TIERS: AffiliateTier[] = [
  { name: "Tier 1", kickback: "10%", threshold: 0 },
  { name: "Tier 2", kickback: "12.5%", threshold: 250 },
  { name: "Tier 3", kickback: "15%", threshold: 1000 },
  { name: "Tier 4", kickback: "17.5%", threshold: 2500 },
  { name: "Tier 5", kickback: "20%", threshold: 5000 },
];

export const AFFILIATE_TOP_RATE = AFFILIATE_TIERS[AFFILIATE_TIERS.length - 1].kickback;
export const AFFILIATE_START_RATE = AFFILIATE_TIERS[0].kickback;

/** Facts about how the programme works, so no page has to guess. */
export const AFFILIATE_FACTS = {
  /** Earnings land as affiliate balance and are transferred to store balance. */
  payout: "Store balance, transferred from your affiliate balance on request",
  cookieless:
    "Referrals are tied to the code entered at signup, not to a browser cookie, so they do not expire when someone clears their browser",
  selfReferral: "Self-referrals and referring your own alternate accounts are not eligible",
} as const;

export function tierFor(totalReferredRevenue: number): AffiliateTier {
  let current = AFFILIATE_TIERS[0];
  for (const tier of AFFILIATE_TIERS) {
    if (totalReferredRevenue >= tier.threshold) current = tier;
  }
  return current;
}
