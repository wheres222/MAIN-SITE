/**
 * USD exchange rates — SERVER SIDE ONLY.
 *
 * Two independent sources with a hard-coded floor underneath, because a price
 * is not an optional part of a product card. If the whole chain fails the site
 * still renders a number that is close enough for a figure already labelled as
 * an estimate, rather than rendering nothing or a raw USD amount under a "€"
 * sign — which would be a lie rather than an approximation.
 *
 * Both sources are keyless and free:
 *   frankfurter.app       — European Central Bank reference rates
 *   open.er-api.com       — exchangerate-api's free tier
 */
import "server-only";
import { CURRENCIES, FALLBACK_RATES, type Rates } from "@/lib/preferences";
import { logger } from "@/lib/logger";

const SYMBOLS = CURRENCIES.map((c) => c.code).filter((c) => c !== "USD");

/** Rates change slowly; a stale-by-an-hour estimate is not worth a fetch per request. */
export const RATES_TTL_SECONDS = 60 * 60 * 6;

function sane(rates: Record<string, unknown>): Rates | null {
  const out: Rates = { USD: 1 };

  for (const code of SYMBOLS) {
    const value = rates[code];
    if (typeof value !== "number" || !isFinite(value) || value <= 0) return null;
    // A rate outside this band against the dollar means the payload is not
    // what we think it is — a base mix-up, or an error body shaped like data.
    // Better to fall through to the next source than to price against it.
    if (value < 0.05 || value > 1000) return null;
    out[code] = value;
  }
  return out;
}

async function fromFrankfurter(): Promise<Rates | null> {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS.join(",")}`,
    { next: { revalidate: RATES_TTL_SECONDS } }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { rates?: Record<string, unknown> };
  return json.rates ? sane(json.rates) : null;
}

async function fromErApi(): Promise<Rates | null> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: RATES_TTL_SECONDS },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { rates?: Record<string, unknown> };
  return json.rates ? sane(json.rates) : null;
}

/**
 * Never throws and never returns a partial set — callers can always format a
 * price with whatever comes back.
 */
export async function getRates(): Promise<{ rates: Rates; source: string }> {
  for (const [name, fetcher] of [
    ["frankfurter", fromFrankfurter],
    ["er-api", fromErApi],
  ] as const) {
    try {
      const rates = await fetcher();
      if (rates) return { rates, source: name };
      logger.warn("FX source returned unusable rates", { source: name });
    } catch (err) {
      logger.warn("FX source failed", { source: name, err: String(err).slice(0, 120) });
    }
  }

  logger.error("All FX sources failed — using built-in fallback rates", {});
  return { rates: FALLBACK_RATES, source: "fallback" };
}
