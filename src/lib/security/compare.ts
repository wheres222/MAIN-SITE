import "server-only";

/**
 * Compare two secrets without leaking their contents through timing.
 *
 * `a === b` on strings short-circuits at the first differing byte, so how long
 * the comparison takes is a function of how many leading characters matched.
 * Across enough samples that is enough to recover a secret one character at a
 * time, without ever guessing the whole thing.
 *
 * Extracted because the three places this codebase checks a secret did three
 * different things: the NOWPayments webhook rolled its own constant-time loop,
 * the Stripe webhook got it free from the SDK, and the SellAuth webhook and the
 * status push endpoint both used a plain `===`.
 *
 * Length is compared first and returns early — that does leak the length, which
 * is not sensitive for a fixed-width HMAC digest or an API key, and comparing
 * different-length strings byte-wise cannot be made constant-time anyway.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
