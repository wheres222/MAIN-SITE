import "server-only";

/**
 * Fixed-window rate limiter, per serverless instance.
 *
 * Extracted from the checkout route so the deposit endpoints stop being the
 * only money-touching routes with no limit at all. Same globalThis pattern used
 * by the checkout dedupe store and the blocklist snapshot.
 *
 * Per-instance means a determined attacker spread across many cold starts gets
 * more than `max` — this raises the cost of abuse rather than making it
 * impossible. A shared counter would need Redis, which this project does not
 * have, and an approximate limit in front of a payment provider is worth
 * considerably more than no limit while that is arranged.
 */

interface Entry {
  count: number;
  resetAt: number;
}

function store(bucket: string): Map<string, Entry> {
  const g = globalThis as typeof globalThis & {
    __rateLimitBuckets?: Map<string, Map<string, Entry>>;
  };
  if (!g.__rateLimitBuckets) g.__rateLimitBuckets = new Map();
  let b = g.__rateLimitBuckets.get(bucket);
  if (!b) {
    b = new Map();
    g.__rateLimitBuckets.set(bucket, b);
  }
  return b;
}

export interface RateLimitResult {
  limited: boolean;
  /** Requests used in the current window, including this one. */
  count: number;
  /** Seconds until the window resets — suitable for a Retry-After header. */
  retryAfter: number;
}

export function rateLimit(
  bucket: string,
  key: string,
  options: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  const map = store(bucket);

  // Opportunistic sweep. Without it a long-lived instance accumulates an entry
  // per key forever, which is a slow memory leak on a route anyone can hit.
  if (map.size > 5000) {
    for (const [k, v] of map) if (v.resetAt <= now) map.delete(k);
  }

  const existing = map.get(key);
  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, count: 1, retryAfter: 0 };
  }

  existing.count += 1;
  return {
    limited: existing.count > options.max,
    count: existing.count,
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
