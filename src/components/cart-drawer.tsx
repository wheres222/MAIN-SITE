"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";
import styles from "./cart-drawer.module.css";

/**
 * Slide-in cart, styled to the checkout: same slate-tinted panels, sunken
 * rows and uppercase micro-labels, so the two halves of buying something look
 * like one flow rather than two products.
 *
 * Mounted once in the root layout. It renders nothing until first opened, so
 * an empty cart costs a boolean rather than a subtree on every page.
 */
export function CartDrawer() {
  const { lines, count, subtotalUsd, changeQuantity, remove, isOpen, closeCart } = useCart();
  const { t, money, moneyUsd, converted } = usePreferences();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasOpened, setHasOpened] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // Escape closes, and the page behind stops scrolling. Without the scroll
  // lock a phone scrolls the page under the drawer instead of the drawer.
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
      if (e.key !== "Tab" || !panelRef.current) return;

      // Keep Tab inside the drawer. A dialog that quietly moves focus to the
      // page behind it strands keyboard and screen-reader users.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
    // hasOpened is a dependency, not decoration: on the very first open the
    // panel has not rendered yet when this effect first runs, so closeRef is
    // null and focus stays on the page behind the dialog.
  }, [isOpen, hasOpened, closeCart]);

  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setError("");
    try {
      // The route requires a payment method and answers with `redirectUrl`.
      // This originally sent only `items` and then read `url`, so cart checkout
      // failed twice over: 400 "paymentMethod or currency is required", and
      // nowhere to go even if it had succeeded. Buy Now on the product page
      // has always sent this shape — the cart just never matched it.
      const idempotencyKey = [
        "stripe",
        ...lines.map((l) => `${l.productId}:${l.variantId ?? 0}:${l.quantity}`),
        Date.now().toString(),
      ].join("|");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          paymentMethod: "stripe",
          currency: "stripe",
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            ...(l.variantId ? { variantId: l.variantId } : {}),
          })),
        }),
      });

      const payload = (await res.json()) as {
        success?: boolean;
        redirectUrl?: string | null;
        message?: string;
      };

      if (!res.ok || !payload.redirectUrl) {
        // The route explains itself — an out-of-stock variant, a minimum
        // quantity, a provider outage — so pass that through rather than
        // replacing it with a generic failure.
        setError(payload.message || t("common.error"));
        return;
      }

      window.location.href = payload.redirectUrl;
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (!hasOpened) return null;

  return (
    <div
      className={`${styles.root} ${isOpen ? styles.rootOpen : ""}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.overlay} onClick={closeCart} />

      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.cart")}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>
            {t("cart.cart")}
            {count > 0 && <span className={styles.countPill}>{count}</span>}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label={t("common.close")}
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{t("cart.empty")}</p>
            <Link href="/products" className={styles.emptyBtn} onClick={closeCart}>
              {t("account.browseStore")}
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.lineId} className={styles.line}>
                  {line.image ? (
                    <img src={line.image} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbFallback} aria-hidden />
                  )}

                  <div className={styles.lineBody}>
                    <span className={styles.lineName}>{line.productName}</span>
                    {line.variantName && (
                      <span className={styles.lineVariant}>{line.variantName}</span>
                    )}

                    <div className={styles.lineFoot}>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.lineId, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className={styles.qty}>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(line.lineId, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className={styles.lineTotal}>
                        {money(line.unitPrice * line.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(line.lineId)}
                    aria-label={`${t("cart.remove")} ${line.productName}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <footer className={styles.foot}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>{t("cart.subtotal")}</span>
                <span className={styles.summaryValue}>{money(subtotalUsd)}</span>
              </div>

              {/* The charge is always USD. When the display currency is
                  something else, the real figure belongs above the button. */}
              {converted && (
                <p className={styles.chargeNote}>
                  {t("currency.chargedIn", { amount: moneyUsd(subtotalUsd) })}
                </p>
              )}

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={checkout}
                disabled={busy}
              >
                {busy ? `${t("common.loading")}…` : t("cart.checkout")}
              </button>

              <button type="button" className={styles.keepShopping} onClick={closeCart}>
                {t("account.browseStore")}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
