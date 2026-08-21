/**
 * Display preferences: UI language and display currency.
 *
 * Two deliberate limits, both worth stating up front because they shape
 * everything below.
 *
 * 1. Currency is DISPLAY ONLY. Stripe charges USD and NOWPayments prices in
 *    USD, and neither is touched by this. A converted price is an estimate, so
 *    every checkout surface says what will actually be charged. Showing €41.99
 *    and then billing $44.99 without saying so would be the kind of surprise
 *    that generates chargebacks.
 *
 * 2. Translation covers UI chrome only — nav, buttons, forms, checkout, the
 *    account area. Blog posts and the game/product SEO pages stay in English
 *    on purpose: machine-translated prose is discounted by Google and would
 *    put the ranking content at risk for no gain.
 *
 * Because content stays English, there are no per-locale routes and no
 * hreflang. The preference is a cookie, the URL never changes, and Google
 * continues to see exactly one English page per URL.
 */

export const LOCALE_COOKIE = "cp_locale";
export const CURRENCY_COOKIE = "cp_currency";

/** A year: this is a preference, not a session. */
export const PREF_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface LocaleMeta {
  code: string;
  /** Endonym — a language picker that says "German" to a German speaker is
   *  useless to the person most likely to need it. */
  label: string;
  english: string;
}

export const LOCALES: readonly LocaleMeta[] = [
  { code: "en", label: "English",    english: "English" },
  { code: "de", label: "Deutsch",    english: "German" },
  { code: "ru", label: "Русский",    english: "Russian" },
  { code: "es", label: "Español",    english: "Spanish" },
  { code: "fr", label: "Français",   english: "French" },
  { code: "pt", label: "Português",  english: "Portuguese" },
  { code: "pl", label: "Polski",     english: "Polish" },
  { code: "tr", label: "Türkçe",     english: "Turkish" },
] as const;

export const DEFAULT_LOCALE = "en";

export function isKnownLocale(value: string | null | undefined): boolean {
  return !!value && LOCALES.some((l) => l.code === value);
}

export function normalizeLocale(value: string | null | undefined): string {
  return isKnownLocale(value) ? (value as string) : DEFAULT_LOCALE;
}

export interface CurrencyMeta {
  code: string;
  symbol: string;
  label: string;
  /** BCP-47 tag used only for number grouping and symbol placement. */
  numberLocale: string;
}

export const CURRENCIES: readonly CurrencyMeta[] = [
  { code: "USD", symbol: "$",  label: "US Dollar",         numberLocale: "en-US" },
  { code: "EUR", symbol: "€",  label: "Euro",              numberLocale: "de-DE" },
  { code: "GBP", symbol: "£",  label: "British Pound",     numberLocale: "en-GB" },
  { code: "CAD", symbol: "$",  label: "Canadian Dollar",   numberLocale: "en-CA" },
  { code: "AUD", symbol: "$",  label: "Australian Dollar", numberLocale: "en-AU" },
] as const;

export const BASE_CURRENCY = "USD";

export function isKnownCurrency(value: string | null | undefined): boolean {
  return !!value && CURRENCIES.some((c) => c.code === value);
}

export function normalizeCurrency(value: string | null | undefined): string {
  return isKnownCurrency(value) ? (value as string) : BASE_CURRENCY;
}

export type Rates = Record<string, number>;

/**
 * Last-known rates, used only when both upstream sources fail.
 *
 * A stale rate is a small pricing inaccuracy on a figure already labelled as
 * an estimate; a missing rate means a product card renders no price at all.
 * The first is clearly the better failure, so this exists as a floor rather
 * than as a source of truth. Captured 2026-08-20 from ECB reference rates.
 */
export const FALLBACK_RATES: Rates = {
  USD: 1,
  EUR: 0.856,
  GBP: 0.734,
  CAD: 1.377,
  AUD: 1.407,
};

/** Converts a USD amount into `currency`, falling back to USD when unknown. */
export function convertFromUsd(usd: number, currency: string, rates: Rates): number {
  const rate = rates[currency];
  if (!rate || !isFinite(rate)) return usd;
  return usd * rate;
}

/**
 * The single money formatter for the whole site.
 *
 * Four copies of a `money()` helper existed before this, each formatting USD
 * with its own rules, which is why a currency switcher had nowhere to hook in.
 */
export function formatMoney(
  usd: number,
  currency: string = BASE_CURRENCY,
  rates: Rates = FALLBACK_RATES
): string {
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const value = convertFromUsd(usd, meta.code, rates);

  try {
    return new Intl.NumberFormat(meta.numberLocale, {
      style: "currency",
      currency: meta.code,
      // CAD and AUD share "$" with USD, so the code has to stay visible or a
      // Canadian visitor cannot tell which dollar they are being quoted.
      currencyDisplay: meta.code === "USD" ? "symbol" : "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${meta.symbol}${value.toFixed(2)}`;
  }
}

/** True when the displayed price is a conversion rather than the charged amount. */
export function isConverted(currency: string): boolean {
  return normalizeCurrency(currency) !== BASE_CURRENCY;
}
