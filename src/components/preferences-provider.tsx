"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  BASE_CURRENCY,
  CURRENCY_COOKIE,
  DEFAULT_LOCALE,
  FALLBACK_RATES,
  LOCALE_COOKIE,
  PREF_COOKIE_MAX_AGE,
  formatMoney as formatMoneyRaw,
  isConverted,
  normalizeCurrency,
  normalizeLocale,
  type Rates,
} from "@/lib/preferences";
import { translate, type TranslationKey } from "@/lib/i18n/dictionaries";

interface PreferencesValue {
  locale: string;
  currency: string;
  rates: Rates;
  /** Translate a chrome string. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Format a USD amount into the chosen display currency. */
  money: (usd: number) => string;
  /** The same amount in USD, for the "you will be charged" disclosure. */
  moneyUsd: (usd: number) => string;
  /** True when `money()` is showing a conversion rather than the real charge. */
  converted: boolean;
  setLocale: (code: string) => void;
  setCurrency: (code: string) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

/**
 * Writes a preference cookie.
 *
 * Not httpOnly on purpose: this is a display preference the client itself sets
 * and reads, and nothing is authorised by it. It is readable server-side so
 * the first paint already matches the choice — a locale kept only in
 * localStorage would render English, then flip after hydration.
 */
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREF_COOKIE_MAX_AGE}; samesite=lax`;
}

export function PreferencesProvider({
  children,
  initialLocale,
  initialCurrency,
  initialRates,
}: {
  children: ReactNode;
  initialLocale?: string;
  initialCurrency?: string;
  initialRates?: Rates;
}) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(initialLocale));
  const [currency, setCurrencyState] = useState(() => normalizeCurrency(initialCurrency));
  const rates = useMemo(() => initialRates ?? FALLBACK_RATES, [initialRates]);

  const setLocale = useCallback((code: string) => {
    const next = normalizeLocale(code);
    setLocaleState(next);
    writeCookie(LOCALE_COOKIE, next);
    // The <html lang> attribute is server-rendered, so keep it in step without
    // a reload. Chrome-only translation means this describes the shell, not
    // the article body — see the note in the layout.
    document.documentElement.setAttribute("data-ui-lang", next);
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = normalizeCurrency(code);
    setCurrencyState(next);
    writeCookie(CURRENCY_COOKIE, next);
  }, []);

  const value = useMemo<PreferencesValue>(
    () => ({
      locale,
      currency,
      rates,
      t: (key, vars) => translate(locale, key, vars),
      money: (usd) => formatMoneyRaw(usd, currency, rates),
      moneyUsd: (usd) => formatMoneyRaw(usd, BASE_CURRENCY, rates),
      converted: isConverted(currency),
      setLocale,
      setCurrency,
    }),
    [locale, currency, rates, setLocale, setCurrency]
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

/**
 * Falls back to English + USD rather than throwing when used outside the
 * provider. A price that renders in the default currency is a far better
 * failure than a component tree that refuses to render at all.
 */
export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (ctx) return ctx;

  return {
    locale: DEFAULT_LOCALE,
    currency: BASE_CURRENCY,
    rates: FALLBACK_RATES,
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    money: (usd) => formatMoneyRaw(usd, BASE_CURRENCY, FALLBACK_RATES),
    moneyUsd: (usd) => formatMoneyRaw(usd, BASE_CURRENCY, FALLBACK_RATES),
    converted: false,
    setLocale: () => {},
    setCurrency: () => {},
  };
}
