"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./deposit.module.css";

/* ── Crypto coin data ─────────────────────────────────────
   Only coins NOWPayments settles for us and that people actually pay with.
   XRP, TRX, DOGE and USDC were removed — see the git history if you need the
   old icon markup back. */
const CRYPTOS = [
  { id: "btc",  label: "Bitcoin",      color: "#F7931A", textColor: "#fff",
    icon: <path d="M11.5 7v1.5c1.5 0 2.5.6 2.5 1.5s-1 1.5-2.5 1.5v1c1.8 0 3 .8 3 2s-1.2 2-3 2V18h-1v-1.5c-1.6-.1-2.5-.8-2.5-2h1.5c0 .6.4 1 1 1V13c-1.8 0-3-.8-3-2s1.2-2 3-2V7h1Zm-1 5v-2c-.8 0-1.5.4-1.5 1s.7 1 1.5 1Zm1 1v2.5c.9-.1 1.5-.5 1.5-1.2 0-.8-.7-1.2-1.5-1.3Z" fill="currentColor" /> },
  { id: "eth",  label: "Ethereum",     color: "#627EEA", textColor: "#fff",
    icon: <><path d="M12 4 7 12.5l5 3 5-3L12 4Z" fill="currentColor" opacity=".7"/><path d="M12 17.5 7 13l5 7 5-7-5 4.5Z" fill="currentColor"/></> },
  { id: "sol",  label: "Solana",       color: "#9945FF", textColor: "#fff",
    icon: <><path d="M7 9h9.5l-1.5 2H7l1.5-2ZM7 13h9.5l-1.5 2H7l1.5-2ZM8.5 5H18l-1.5 2H7L8.5 5Z" fill="currentColor"/></> },
  { id: "ltc",  label: "Litecoin",     color: "#A0A0A0", textColor: "#fff",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">Ł</text> },
  { id: "usdt", label: "Tether",       color: "#26A17B", textColor: "#fff",
    icon: <><rect x="6" y="9" width="12" height="1.5" rx=".75" fill="currentColor"/><text x="12" y="17" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">USDT</text></> },
  { id: "bnb",  label: "Binance Coin", color: "#F3BA2F", textColor: "#1a1a1a",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">BNB</text> },
  { id: "busd", label: "Binance USD",  color: "#F3BA2F", textColor: "#1a1a1a",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">BUSD</text> },
];

interface PaymentResult {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  expires_at: string;
}

type Step = "form" | "coin" | "paying";
type Method = "crypto" | "card";

/**
 * Kept in step with the API routes, which enforce the real limits — this is
 * only so the cap is visible before someone types a number the server will
 * reject.
 */
const MAX_BY_METHOD = { card: 150, crypto: 500 } as const;

export default function DepositPage() {
  const [step, setStep] = useState<Step>("form");
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<Method>("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTOS[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client.
  const supabase = useMemo(() => createClient(), []);
  const [returnStatus, setReturnStatus] = useState<"success" | "cancelled" | null>(null);

  // Read once on mount rather than via useSearchParams, which would force this
  // page into a Suspense boundary for a banner that only matters on return.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success" || status === "cancelled") setReturnStatus(status);
  }, []);

  // The card leads with the current balance, so it has to be read here — the
  // deposit page previously never needed it.
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();
      setBalance(Number(profile?.balance ?? 0));
    }
    load();
  }, [supabase]);

  // Countdown timer when on paying step
  useEffect(() => {
    if (step === "paying" && payment?.expires_at) {
      const expiry = new Date(payment.expires_at).getTime();
      function tick() {
        const secs = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
        setSecondsLeft(secs);
        if (secs === 0 && timerRef.current) clearInterval(timerRef.current);
      }
      tick();
      timerRef.current = setInterval(tick, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, payment]);

  function goBack() {
    if (step === "paying") { setStep("coin"); setPayment(null); }
    else if (step === "coin") { setStep("form"); }
  }

  /**
   * Submitting the card is the fork: card hands straight to Stripe, crypto
   * moves to the coin grid. The amount is validated once, here, so neither
   * path can reach a provider with a number the server will reject.
   */
  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 1) { setError("Minimum deposit is $1.00"); return; }
    if (parsed > MAX_BY_METHOD[method]) {
      setError(`Maximum is ${MAX_BY_METHOD[method]}.00 for this payment method.`);
      return;
    }
    setError("");
    if (method === "card") { void handleCardCheckout(); return; }
    setSelectedCrypto(null);
    setStep("coin");
  }

  function selectCrypto(coin: typeof CRYPTOS[0]) {
    setSelectedCrypto(coin);
    setError("");
    void handleGetAddress(coin);
  }

  /**
   * Card deposits hand off to Stripe Checkout. Nothing is credited here — the
   * webhook does that after Stripe confirms payment, which is why returning
   * from Checkout shows "processing" rather than a new balance.
   */
  async function handleCardCheckout() {
    const parsed = parseFloat(amount);

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/deposit/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start card payment. Try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAddress(coin: typeof CRYPTOS[0]) {
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 1) { setError("Minimum deposit is $1.00"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, currency: coin.id }),
      });
      const data = await res.json() as PaymentResult & { error?: string };
      if (!res.ok) { setError(data.error || "Failed to create payment. Try again."); return; }
      setPayment(data);
      setStep("paying");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyAddress() {
    if (!payment?.pay_address) return;
    navigator.clipboard.writeText(payment.pay_address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <>
      {/* Stripe sends people back here after Checkout. The balance is credited by
          the webhook, not by this page, so a successful return means "paid and
          processing" rather than "already in your balance" — saying otherwise
          would have people refreshing and thinking money was lost. */}
      {returnStatus === "success" && (
        <div className={styles.infoNote} style={{ marginBottom: 18 }}>
          <span>
            <strong>Payment received.</strong> Your balance updates as soon as Stripe
            confirms it — usually within a few seconds. Refresh if it has not appeared
            after a minute, and contact support if it still has not.
          </span>
        </div>
      )}
      {returnStatus === "cancelled" && (
        <p className={styles.errorMsg} style={{ marginBottom: 18 }}>
          Card payment cancelled. Nothing was charged.
        </p>
      )}

      {/* ── STEP 1: Amount + method ──────────────────────────── */}
      {step === "form" && (
        <form className={styles.topUpCard} onSubmit={handleContinue}>
          <span className={styles.kicker}>Top up — Cheat Paradise</span>

          <div className={styles.balanceRow}>
            <span className={styles.balanceAmount}>${balance.toFixed(2)}</span>
            <span className={styles.balanceCaption}>current balance</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="deposit-amount" className={styles.fieldLabel}>Amount ($)</label>
            <input
              id="deposit-amount"
              type="number"
              min="1"
              max={MAX_BY_METHOD[method]}
              step="0.01"
              className={styles.input}
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
            {/* The cap differs by method and the server enforces it, so it has
                to be visible here — otherwise a card deposit over $150 is only
                rejected after the form is submitted. */}
            <span className={styles.inputHint}>
              Minimum $1.00 · maximum ${MAX_BY_METHOD[method]}.00 by{" "}
              {method === "card" ? "card" : "crypto"}
            </span>
          </div>

          <div className={styles.field}>
            <label htmlFor="receipt-email" className={styles.fieldLabel}>Receipt email</label>
            {/* Read-only: receipts follow the account, and both deposit routes
                take the address from the authenticated session rather than
                from this form. An editable box here would be a field that
                silently does nothing. */}
            <input
              id="receipt-email"
              type="email"
              className={`${styles.input} ${styles.inputReadonly}`}
              value={email}
              readOnly
              aria-describedby="receipt-email-hint"
            />
            <span id="receipt-email-hint" className={styles.inputHint}>
              Receipts go to your account email.
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Pay with</span>
            <div className={styles.methodTabs}>
              <button
                type="button"
                className={`${styles.methodTab} ${method === "crypto" ? styles.methodTabActive : ""}`}
                onClick={() => { setMethod("crypto"); setError(""); }}
                aria-pressed={method === "crypto"}
              >
                Crypto
              </button>
              <button
                type="button"
                className={`${styles.methodTab} ${method === "card" ? styles.methodTabActive : ""}`}
                onClick={() => { setMethod("card"); setError(""); }}
                aria-pressed={method === "card"}
              >
                Credit/Debit Card, Apple Pay, Google Pay
              </button>
            </div>
          </div>

          <p className={styles.methodHint}>
            {method === "crypto"
              ? "You'll choose your cryptocurrency on the next page."
              : "You'll be taken to Stripe to complete the payment."}
          </p>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button type="submit" className={styles.continueBtn} disabled={loading}>
            {loading ? <span className={styles.btnSpinner} /> : "Continue to payment"}
          </button>

          <p className={styles.inputHint} style={{ marginTop: 4 }}>
            Already deposited? Your transaction history lives on{" "}
            <Link href="/account/balance">Balances</Link>.
          </p>
        </form>
      )}

      {/* ── STEP 2: Pick a coin ──────────────────────────────── */}
      {step === "coin" && (
        <div className={styles.topUpCard}>
          <div className={styles.stepHeader}>
            <button type="button" className={styles.backBtn} onClick={goBack}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h2 className={styles.stepTitle}>
              Choose a coin for ${parseFloat(amount || "0").toFixed(2)}
            </h2>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.cryptoGrid}>
            {CRYPTOS.map((coin) => (
              <button
                key={coin.id}
                type="button"
                className={styles.cryptoCard}
                onClick={() => selectCrypto(coin)}
                disabled={loading}
              >
                <div className={styles.cryptoIcon} style={{ background: coin.color }}>
                  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden style={{ color: coin.textColor }}>
                    {coin.icon}
                  </svg>
                </div>
                <span className={styles.cryptoLabel}>{coin.label}</span>
              </button>
            ))}
          </div>

          {loading && (
            <div className={styles.waitingRow}>
              <span className={styles.waitingDot} />
              Creating your payment address…
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Send crypto ──────────────────────────────── */}
      {step === "paying" && payment && selectedCrypto && (
        <div className={styles.body}>
          <div className={styles.stepHeader}>
            <button type="button" className={styles.backBtn} onClick={goBack}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h2 className={styles.stepTitle}>Send {selectedCrypto.label}</h2>
          </div>

          <div className={styles.paymentSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>You deposit</span>
              <span className={styles.summaryValue}>${parseFloat(amount).toFixed(2)} USD</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Send exactly</span>
              <span className={styles.summaryValueHighlight}>
                {payment.pay_amount} {payment.pay_currency.toUpperCase()}
              </span>
            </div>
            {secondsLeft !== null && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Expires in</span>
                <span className={secondsLeft < 120 ? styles.summaryValueWarn : styles.summaryValue}>
                  {formatTimer(secondsLeft)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Send {payment.pay_currency.toUpperCase()} to this address
            </label>
            <div className={styles.addressBox}>
              <span className={styles.addressText}>{payment.pay_address}</span>
              <button type="button" className={styles.copyAddrBtn} onClick={copyAddress} aria-label="Copy address">
                {copied
                  ? <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6 9 17l-5-5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" /></svg>
                }
              </button>
            </div>
            {copied && <span className={styles.copiedNote}>Address copied!</span>}
          </div>

          <div className={styles.infoNote}>
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>
              Send <strong>exactly {payment.pay_amount} {payment.pay_currency.toUpperCase()}</strong> to the address above.
              Your balance is credited automatically after blockchain confirmation — typically 10–30 minutes.
            </span>
          </div>

          <div className={styles.waitingRow}>
            <span className={styles.waitingDot} />
            Waiting for payment confirmation…
          </div>
        </div>
      )}
    </>
  );
}
