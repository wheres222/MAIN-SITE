/**
 * The Discord invite, in one place.
 *
 * `.env.example` has advertised NEXT_PUBLIC_DISCORD_URL since the start, but
 * nothing read it — the invite was a hard-coded constant, so setting the
 * variable did nothing and rotating the invite meant a code change and a
 * deploy. Since every support route on the site points here, an expired invite
 * takes support down until that deploy lands.
 *
 * Reading the variable with the constant as fallback keeps current behaviour
 * when it is unset, and makes rotating the invite an environment change.
 *
 * NEXT_PUBLIC_ is correct here: this is a public invite link rendered into the
 * page for visitors to click, not a secret.
 */
const FALLBACK_INVITE = "https://discord.gg/6yGEKZC8aX";

function resolveInvite(): string {
  const configured = process.env.NEXT_PUBLIC_DISCORD_URL?.trim();
  // Guard the shape rather than trusting it: a malformed value here would be
  // rendered into an href on every page, and "javascript:" in an href is the
  // one thing that must never reach the DOM.
  if (configured && /^https:\/\/(discord\.gg|discord\.com|www\.discord\.com)\//i.test(configured)) {
    return configured;
  }
  return FALLBACK_INVITE;
}

export const DISCORD_INVITE_URL = resolveInvite();

export function getDiscordUrl(): string {
  return DISCORD_INVITE_URL;
}

/**
 * elitepvpers profile or sales thread, shown as a banner in the footer.
 *
 * Returns null when unset, and the footer renders nothing rather than a dead
 * link — a footer badge pointing at a 404 is worse than no badge, because the
 * whole point of it is to look like corroboration.
 *
 * Same host guard as the Discord invite: this value is rendered into an href on
 * every page of the site, so it is checked rather than trusted. Both the .com
 * and the German .de host are accepted since epvp serves profiles on both.
 */
export function getElitepvpersUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_EPVP_URL?.trim();
  if (!configured) return null;
  if (!/^https:\/\/(www\.)?elitepvpers\.(com|de)\//i.test(configured)) return null;
  return configured;
}

/**
 * Caption under the wordmark.
 *
 * Deliberately not hard-coded to something like "Trusted Trader" or "Verified
 * Seller". That is a reputation claim about a third party's system, and this
 * site cannot verify it at build time — stating it anyway on a storefront is
 * exactly the kind of unearned trust signal that costs you when a customer
 * checks. Set it to whatever standing the profile actually shows.
 */
export function getElitepvpersLabel(): string {
  return process.env.NEXT_PUBLIC_EPVP_LABEL?.trim() || "Find us on elitepvpers";
}
