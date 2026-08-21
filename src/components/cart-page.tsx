"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";
import { SiteHeader } from "@/components/site-header";
import styles from "./cart-page.module.css";

export function CartPage() {
  const { lines, count, subtotalUsd, changeQuantity, remove } = useCart();
  const { t, money, moneyUsd, converted } = usePreferences();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /**
   * /api/checkout already accepted an array of items — it was written for a
   * cart that had never been wired up. So the whole cart goes in one request
   * and comes back with a Stripe session for the lot.
   */
  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            ...(l.variantId ? { variantId: l.variantId } : {}),
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; message?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.message || data.error || t("common.error"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader activeTab="none" />

      <main id="main-content" className={styles.main}>
        <div className={styles.head}>
          <h1 className={styles.title}>{t("cart.cart")}</h1>
          {count > 0 && (
            <span className={styles.count}>
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>{t("cart.empty")}</p>
            <Link href="/products" className={styles.emptyBtn}>
              {t("account.browseStore")}
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.lineId} className={styles.line}>
                  {line.image ? (
                    <img src={line.image} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbFallback} aria-hidden />
                  )}

                  <div className={styles.lineInfo}>
                    <span className={styles.lineName}>{line.productName}</span>
                    {line.variantName && (
                      <span className={styles.lineVariant}>{line.variantName}</span>
                    )}
                    <span className={styles.lineUnit}>{money(line.unitPrice)}</span>
                  </div>

                  <div className={styles.lineControls}>
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

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => remove(line.lineId)}
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>{t("cart.orderSummary")}</h2>

              <div className={styles.summaryRow}>
                <span>{t("cart.subtotal")}</span>
                <span className={styles.summaryValue}>{money(subtotalUsd)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>{t("cart.total")}</span>
                <span className={styles.summaryValue}>{money(subtotalUsd)}</span>
              </div>

              {/* The charge is always USD. When the display currency is
                  something else the real figure has to appear before the
                  button, not after the card is charged. */}
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

              <Link href="/products" className={styles.keepShopping}>
                {t("account.browseStore")}
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
