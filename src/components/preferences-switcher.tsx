"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCIES, LOCALES } from "@/lib/preferences";
import { usePreferences } from "@/components/preferences-provider";
import styles from "./preferences-switcher.module.css";

/**
 * Header control for UI language and display currency.
 *
 * One button opening one panel rather than two separate selects: the two
 * choices are made together on a first visit and almost never touched again,
 * so they do not deserve two permanent slots in a crowded header.
 */
export function PreferencesSwitcher() {
  const { locale, currency, t, setLocale, setCurrency } = usePreferences();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const activeCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("prefs.open")}
      >
        <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
        <span className={styles.triggerText}>
          {activeLocale.code.toUpperCase()} · {activeCurrency.code}
        </span>
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t("prefs.title")}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{t("prefs.language")}</span>
            <div className={styles.optionList}>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`${styles.option} ${l.code === locale ? styles.optionActive : ""}`}
                  onClick={() => setLocale(l.code)}
                  aria-pressed={l.code === locale}
                  lang={l.code}
                >
                  <span className={styles.optionCode}>{l.code.toUpperCase()}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>{t("prefs.currency")}</span>
            <div className={styles.optionList}>
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`${styles.option} ${c.code === currency ? styles.optionActive : ""}`}
                  onClick={() => setCurrency(c.code)}
                  aria-pressed={c.code === currency}
                >
                  <span className={styles.optionCode}>{c.code}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stated here rather than only at checkout: the moment someone picks
              a currency is the moment they form an expectation about what they
              will be billed. */}
          <p className={styles.note}>{t("currency.note")}</p>
        </div>
      )}
    </div>
  );
}
