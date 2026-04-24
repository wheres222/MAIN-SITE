"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./deposit-modal.module.css";

interface DepositModalProps {
  onClose: () => void;
}

/* ── Crypto coin data ─────────────────────────────────── */
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
  { id: "usdc", label: "USD Coin",     color: "#2775CA", textColor: "#fff",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">$</text> },
  { id: "bnb",  label: "Binance Coin", color: "#F3BA2F", textColor: "#1a1a1a",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">BNB</text> },
  { id: "busd", label: "Binance USD",  color: "#F3BA2F", textColor: "#1a1a1a",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">BUSD</text> },
  { id: "doge", label: "Dogecoin",     color: "#C2A633", textColor: "#fff",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">Ð</text> },
  { id: "trx",  label: "Tron",         color: "#FF0013", textColor: "#fff",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">TRX</text> },
  { id: "xrp",  label: "Ripple",       color: "#346AA9", textColor: "#fff",
    icon: <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">XRP</text> },
];

const GAME_METHODS = [
  { id: "rust",  label: "RUST",   provider: "bandit.camp", disabled: false },
  { id: "csgo",  label: "CS:GO",  provider: "Skinify",     disabled: true  },
  { id: "dota2", label: "DOTA 2", provider: "Skinify",     disabled: true  },
  { id: "tf2",   label: "TF2",    provider: "Skinify",     disabled: true  },
];

interface PaymentResult {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  expires_at: string;
}

type Step = "choose" | "amount" | "paying";

export function DepositModal({ onClose }: DepositModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTOS[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (step !== "choose") goBack();
        else onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

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

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function goBack() {
    if (step === "paying") { setStep("amount"); setPayment(null); }
    else if (step === "amount") { setStep("choose"); }
  }

  function selectCrypto(coin: typeof CRYPTOS[0]) {
    setSelectedCrypto(coin);
    setAmount("");
    setError("");
    setStep("amount");
  }

  async function handleGetAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCrypto) return;
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 1) { setError("Minimum deposit is $1.00"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/deposit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, currency: selectedCrypto.id }),
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

  const PRESET_AMOUNTS = ["$5", "$10", "$25", "$50", "$100"];

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* Close */}
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── STEP 1: Choose method ────────────────────────────── */}
        {step === "choose" && (
          <div className={styles.body}>
            <h2 className={styles.title}>Choose a deposit method</h2>

            <div className={styles.gameGrid}>
              {GAME_METHODS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.gameCard} ${g.disabled ? styles.gameCardDisabled : styles.gameCardActive}`}
                  disabled={g.disabled}
                >
                  <div className={styles.gameImg} />
                  {g.disabled && <span className={styles.disabledLabel}>DISABLED</span>}
                  {!g.disabled && <span className={styles.bonusBadge}>+45%</span>}
                  <div className={styles.gameInfo}>
                    <span className={styles.gameName}>{g.label}</span>
                    <span className={styles.gameProvider}>{g.provider}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className={styles.cashRow}>
              <div className={styles.cashSection}>
                <div className={styles.cashHeader}>
                  <span className={styles.sectionLabel}>Cash deposits</span>
                  <span className={styles.freeCrateBadge}>FREE CRATE</span>
                </div>
                <button type="button" className={`${styles.cashCard} ${styles.cashCardDisabled}`} disabled>
                  <div className={styles.cashImg} />
                  <span className={styles.bonusBadge}>+45%</span>
                </button>
              </div>
              <div className={styles.cashSection}>
                <div className={styles.cashHeader}>
                  <span className={styles.sectionLabel}>Buy giftcards</span>
                </div>
                <button type="button" className={`${styles.cashCard} ${styles.cashCardDisabled}`} disabled>
                  <div className={styles.cashImg} />
                  <span className={styles.bonusBadge}>+40%</span>
                </button>
              </div>
            </div>

            <div className={styles.cryptoHeader}>
              <span className={styles.sectionLabel}>Cryptocurrencies</span>
              <span className={styles.bonusBadgeAlt}>+45%</span>
            </div>
            <div className={styles.cryptoGrid}>
              {CRYPTOS.map((coin) => (
                <button
                  key={coin.id}
                  type="button"
                  className={styles.cryptoCard}
                  onClick={() => selectCrypto(coin)}
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
          </div>
        )}

        {/* ── STEP 2: Enter amount ─────────────────────────────── */}
        {step === "amount" && selectedCrypto && (
          <form className={styles.body} onSubmit={handleGetAddress}>
            <div className={styles.stepHeader}>
              <button type="button" className={styles.backBtn} onClick={goBack}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
              <h2 className={styles.title} style={{ marginBottom: 0 }}>Deposit {selectedCrypto.label}</h2>
            </div>

            <div className={styles.selectedCoinRow}>
              <div className={styles.cryptoIcon} style={{ background: selectedCrypto.color, width: 44, height: 44 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden style={{ color: selectedCrypto.textColor }}>
                  {selectedCrypto.icon}
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#f0f4ff", fontSize: "0.96rem" }}>{selectedCrypto.label}</div>
                <div style={{ fontSize: "0.74rem", color: "#6b7280" }}>{selectedCrypto.id.toUpperCase()} · +45% bonus</div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="deposit-amount" className={styles.fieldLabel}>Amount (USD)</label>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                step="0.01"
                className={styles.input}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
              <div className={styles.presetRow}>
                {PRESET_AMOUNTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => setAmount(p.replace("$", ""))}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span className={styles.inputHint}>Minimum deposit: $1.00</span>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : "Get Payment Address →"}
            </button>
          </form>
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
              <h2 className={styles.title} style={{ marginBottom: 0 }}>Send {selectedCrypto.label}</h2>
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
                <button type="button" className={styles.copyAddrBtn} onClick={copyAddress}>
                  {copied
                    ? <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6 9 17l-5-5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" /></svg>
                  }
                </button>
              </div>
              {copied && <span style={{ fontSize: "0.74rem", color: "#4ade80" }}>Address copied!</span>}
            </div>

            <div className={styles.infoNote}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Send <strong>exactly {payment.pay_amount} {payment.pay_currency.toUpperCase()}</strong> to the address above.
              Your balance is credited automatically after blockchain confirmation — typically 10–30 minutes.
            </div>

            <div className={styles.waitingRow}>
              <span className={styles.waitingDot} />
              Waiting for payment confirmation…
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
