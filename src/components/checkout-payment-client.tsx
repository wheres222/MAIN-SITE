"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderItem {
  id:             string;
  product_name:   string;
  variant_name:   string;
  quantity:       number;
  unit_price_usd: number;
  delivery_keys:  string[];
  delivered_at:   string | null;
}

interface GuestOrder {
  id:            string;
  status:        string;
  email:         string;
  totalUsd:      number;
  payCurrency:   string;
  payAddress:    string | null;
  payAmount:     number | null;
  deliveryError: string | null;
  createdAt:     string;
  updatedAt:     string;
}

interface ApiResponse {
  order: GuestOrder;
  items: OrderItem[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending: {
    label: "Awaiting Payment",
    color: "#f59e0b",
    icon:  "⏳",
    desc:  "Send the exact crypto amount to the address below. This page updates automatically.",
  },
  paid: {
    label: "Payment Confirmed",
    color: "#3b82f6",
    icon:  "✅",
    desc:  "Payment received — we're preparing your delivery now.",
  },
  delivering: {
    label: "Delivering",
    color: "#8b5cf6",
    icon:  "🚀",
    desc:  "Fetching your license key from our delivery system…",
  },
  delivered: {
    label: "Delivered!",
    color: "#10b981",
    icon:  "🎮",
    desc:  "Your keys are below. They've also been sent to your email.",
  },
  failed: {
    label: "Delivery Failed",
    color: "#ef4444",
    icon:  "❌",
    desc:  "Something went wrong during delivery. Please contact support with your order ID.",
  },
  refunded: {
    label: "Refunded",
    color: "#6b7280",
    icon:  "↩️",
    desc:  "This order has been refunded.",
  },
};

const POLL_MS  = 5_000;
const MAX_POLLS = 72; // ~6 minutes

// ── Component ─────────────────────────────────────────────────────────────────

export function CheckoutPaymentClient({ orderId }: { orderId: string }) {
  const searchParams   = useSearchParams();
  const stripeStatus   = searchParams.get("stripe"); // "success" | "cancelled" | null

  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);
  const polls   = useRef(0);
  const timer   = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/order/guest/${orderId}`, { cache: "no-store" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error || "Order not found.");
        setLoading(false);
        stopPolling();
        return;
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setLoading(false);
      const { status } = json.order;
      if (status === "delivered" || status === "failed" || status === "refunded") {
        stopPolling();
      }
    } catch {
      setError("Network error — please refresh.");
      setLoading(false);
      stopPolling();
    }
  }

  useEffect(() => {
    fetchOrder();
    timer.current = setInterval(() => {
      polls.current++;
      if (polls.current > MAX_POLLS) { stopPolling(); return; }
      fetchOrder();
    }, POLL_MS);
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.pulse} />
          <p style={{ color: "#64748b", textAlign: "center", marginTop: 16 }}>Loading order…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ color: "#f87171", textAlign: "center", marginBottom: 12 }}>{error}</p>
          <p style={{ textAlign: "center" }}>
            <a href="/" style={{ color: "var(--accent)", fontSize: 14 }}>← Back to store</a>
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { order, items } = data;
  const cfg        = STATUS[order.status] ?? STATUS.pending;
  const isPending  = order.status === "pending";
  const isDelivered = order.status === "delivered";
  const isWorking  = order.status === "paid" || order.status === "delivering";

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Status header ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 10 }}>{cfg.icon}</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: cfg.color }}>{cfg.label}</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, maxWidth: 360, marginInline: "auto" }}>{cfg.desc}</p>
          {stripeStatus === "cancelled" && (
            <p style={{ marginTop: 10, color: "#f87171", fontSize: 13 }}>
              Card payment was cancelled — your order is still open. You can pay by card or crypto below.
            </p>
          )}
        </div>

        {/* ── Order meta ── */}
        <div style={s.meta}>
          {[
            ["Order",  `#${order.id.slice(0, 8).toUpperCase()}`],
            ["Email",  order.email],
            ["Total",  `$${Number(order.totalUsd).toFixed(2)} USD`],
            ["Method", order.payCurrency !== "stripe" ? order.payCurrency.toUpperCase() : "Card"],
          ].map(([label, value]) => (
            <div key={label} style={s.metaRow}>
              <span style={s.metaLabel}>{label}</span>
              <span style={{ color: "#e2e8f0", fontSize: 13, fontFamily: label === "Order" ? "monospace" : undefined }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Crypto payment box ── */}
        {isPending && order.payAddress && (
          <div style={s.cryptoBox}>
            <p style={s.boxLabel}>Send exactly</p>
            <div style={s.copyRow}>
              <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>
                {order.payAmount} {order.payCurrency.toUpperCase()}
              </span>
              <button style={s.copyBtn} onClick={() => copy(String(order.payAmount), "amount")}>
                {copied === "amount" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <p style={{ ...s.boxLabel, marginTop: 14 }}>To this address</p>
            <div style={s.copyRow}>
              <code style={s.addrCode}>{order.payAddress}</code>
              <button style={s.copyBtn} onClick={() => copy(order.payAddress!, "addr")}>
                {copied === "addr" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {/* QR code via free public API */}
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(order.payAddress)}&bgcolor=0d0f14&color=ffffff&margin=6`}
                alt="Payment QR code"
                width={160}
                height={160}
                style={{ borderRadius: 8, display: "block" }}
              />
            </div>

            <p style={{ color: "#475569", fontSize: 12, marginTop: 14, marginBottom: 0, textAlign: "center" }}>
              Send the exact amount shown — we detect payments automatically. Do not close this tab.
            </p>
          </div>
        )}

        {/* ── Processing spinner ── */}
        {isWorking && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <div style={s.spinner} />
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 14 }}>
              Processing… usually under a minute.
            </p>
          </div>
        )}

        {/* ── Items list ── */}
        <div style={{ marginTop: 24 }}>
          <p style={s.sectionLabel}>Order Items</p>
          {items.map((item) => (
            <div key={item.id} style={s.itemRow}>
              <div>
                <p style={{ margin: 0, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{item.product_name}</p>
                <p style={{ margin: "2px 0 0", color: "#a78bfa", fontSize: 12 }}>{item.variant_name} × {item.quantity}</p>
              </div>
              <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>
                ${(item.unit_price_usd * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Delivered keys ── */}
        {isDelivered && items.some((i) => (i.delivery_keys?.length ?? 0) > 0) && (
          <div style={{ marginTop: 24 }}>
            <p style={s.sectionLabel}>🔑 Your License Keys</p>
            {items.map((item) =>
              (item.delivery_keys?.length ?? 0) > 0 ? (
                <div key={item.id} style={{ marginBottom: 16 }}>
                  <p style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>
                    {item.product_name} — {item.variant_name}
                  </p>
                  {item.delivery_keys.map((key, i) => (
                    <div key={i} style={s.keyRow}>
                      <code style={s.keyCode}>{key}</code>
                      <button style={s.copyBtn} onClick={() => copy(key, `key-${item.id}-${i}`)}>
                        {copied === `key-${item.id}-${i}` ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null
            )}
            <p style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>
              Keys also sent to {order.email}
            </p>
          </div>
        )}

        {/* ── Delivery failure ── */}
        {order.status === "failed" && (
          <div style={s.errorBox}>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Delivery error</p>
            {order.deliveryError && (
              <p style={{ margin: "0 0 10px", fontSize: 12, opacity: 0.8 }}>{order.deliveryError}</p>
            )}
            <p style={{ margin: 0, fontSize: 12 }}>
              Contact support with order ID <strong style={{ fontFamily: "monospace" }}>#{order.id}</strong> and we'll resolve this immediately.
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid #1e293b" }}>
          <a href="/" style={{ color: "#475569", fontSize: 13 }}>← Back to store</a>
        </div>

      </div>

      {/* Global spinner keyframes */}
      <style>{`@keyframes cp-spin { to { transform: rotate(360deg); } } @keyframes cp-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "60px 16px 60px",
    background: "#0b0c0f",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: "32px 28px",
  },
  meta: {
    background: "#0d1117",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 20,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #1a2234",
  },
  metaLabel: {
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  cryptoBox: {
    background: "#0d1117",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "18px 16px",
    marginBottom: 20,
  },
  boxLabel: {
    color: "#64748b",
    fontSize: 11,
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  copyRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  addrCode: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#34d399",
    background: "#0a0a0a",
    padding: "7px 10px",
    borderRadius: 5,
    wordBreak: "break-all",
    flex: 1,
  },
  copyBtn: {
    background: "#1e293b",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "5px 11px",
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 10px",
    fontWeight: 600,
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #1a2234",
  },
  keyRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  keyCode: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#34d399",
    background: "#0a0a0a",
    padding: "6px 10px",
    borderRadius: 5,
    wordBreak: "break-all",
    flex: 1,
  },
  errorBox: {
    background: "#1f0707",
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    padding: 16,
    color: "#fca5a5",
    fontSize: 13,
    marginTop: 20,
  },
  spinner: {
    width: 30,
    height: 30,
    border: "3px solid #1e293b",
    borderTop: "3px solid #a78bfa",
    borderRadius: "50%",
    animation: "cp-spin 0.8s linear infinite",
    display: "inline-block",
  },
  pulse: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#1e293b",
    animation: "cp-pulse 1.4s ease-in-out infinite",
    margin: "0 auto",
  },
};
