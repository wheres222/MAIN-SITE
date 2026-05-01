"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id:            string;
  product_name:  string;
  variant_name:  string;
  quantity:      number;
  unit_price_usd: number;
  delivery_keys: string[];
  delivered_at:  string | null;
}

interface Order {
  id:                   string;
  status:               string;
  email:                string;
  totalUsd:             number;
  payCurrency:          string;
  payAddress:           string | null;
  payAmount:            number | null;
  nowpaymentsPaymentId: string | null;
  deliveryError:        string | null;
  createdAt:            string;
  updatedAt:            string;
}

interface ApiResponse {
  order: Order;
  items: OrderItem[];
}

// Status configuration
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; emoji: string; description: string }
> = {
  pending: {
    label:       "Awaiting Payment",
    color:       "#f59e0b",
    emoji:       "⏳",
    description: "Send your payment to the address below. We'll confirm automatically.",
  },
  paid: {
    label:       "Payment Confirmed",
    color:       "#3b82f6",
    emoji:       "✅",
    description: "Payment received — preparing your delivery now.",
  },
  delivering: {
    label:       "Delivering",
    color:       "#8b5cf6",
    emoji:       "🚀",
    description: "Fetching your product keys from our delivery system…",
  },
  delivered: {
    label:       "Delivered",
    color:       "#10b981",
    emoji:       "🎮",
    description: "Your keys are ready. Check your email too!",
  },
  failed: {
    label:       "Delivery Failed",
    color:       "#ef4444",
    emoji:       "❌",
    description: "Something went wrong. Please contact support with your order ID.",
  },
  refunded: {
    label:       "Refunded",
    color:       "#6b7280",
    emoji:       "↩️",
    description: "This order has been refunded.",
  },
};

const POLL_INTERVAL_MS = 4_000;
const MAX_POLLS        = 75; // ~5 minutes

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderConfirmClient({ orderId }: { orderId: string }) {
  const searchParams  = useSearchParams();
  const cancelled     = searchParams.get("cancelled") === "1";

  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);
  const pollCount = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch order ─────────────────────────────────────────────────────────────

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/order/shop/${orderId}`, { cache: "no-store" });
      if (res.status === 401) {
        setError("Please log in to view this order.");
        setLoading(false);
        stopPolling();
        return;
      }
      if (res.status === 404) {
        setError("Order not found.");
        setLoading(false);
        stopPolling();
        return;
      }
      if (!res.ok) {
        setError("Failed to load order. Please refresh.");
        setLoading(false);
        stopPolling();
        return;
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setLoading(false);

      // Stop polling once we reach a terminal state
      const status = json.order.status;
      if (status === "delivered" || status === "failed" || status === "refunded") {
        stopPolling();
      }
    } catch {
      setError("Network error. Please refresh.");
      setLoading(false);
      stopPolling();
    }
  }

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── Poll ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchOrder();

    timerRef.current = setInterval(() => {
      pollCount.current++;
      if (pollCount.current > MAX_POLLS) {
        stopPolling();
        return;
      }
      fetchOrder();
    }, POLL_INTERVAL_MS);

    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ── Copy helper ─────────────────────────────────────────────────────────────

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>
            Loading order…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ color: "#f87171", textAlign: "center" }}>{error}</p>
          <p style={{ textAlign: "center", marginTop: 8 }}>
            <a href="/" style={{ color: "#a78bfa", fontSize: 14 }}>← Back to store</a>
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, items } = data;
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isPending    = order.status === "pending";
  const isDelivered  = order.status === "delivered";
  const isProcessing = order.status === "paid" || order.status === "delivering";
  const isCrypto     = order.payCurrency !== "stripe";

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.emoji}</div>
          <h1 style={{ ...s.h1, color: cfg.color }}>{cfg.label}</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>{cfg.description}</p>
          {cancelled && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>
              Payment was cancelled. Your order is still open — send payment to complete it.
            </p>
          )}
        </div>

        {/* Order ID + email */}
        <div style={s.meta}>
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Order</span>
            <span style={s.metaMono}>#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Email</span>
            <span style={{ color: "#e2e8f0", fontSize: 13 }}>{order.email}</span>
          </div>
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Total</span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>${order.totalUsd.toFixed(2)}</span>
          </div>
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Method</span>
            <span style={{ color: "#e2e8f0", fontSize: 13 }}>
              {order.payCurrency === "stripe" ? "💳 Card" : `₿ ${order.payCurrency.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* ── Crypto payment box (pending only) ── */}
        {isPending && isCrypto && order.payAddress && (
          <div style={s.cryptoBox}>
            <p style={s.cryptoLabel}>Send exactly:</p>
            <div style={s.amountRow}>
              <span style={s.amount}>{order.payAmount} {order.payCurrency.toUpperCase()}</span>
              <button
                style={s.copyBtn}
                onClick={() => copy(String(order.payAmount), "amount")}
              >
                {copied === "amount" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p style={s.cryptoLabel}>To address:</p>
            <div style={s.addressRow}>
              <code style={s.address}>{order.payAddress}</code>
              <button
                style={s.copyBtn}
                onClick={() => copy(order.payAddress!, "address")}
              >
                {copied === "address" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p style={{ color: "#64748b", fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Send the exact amount. This page updates automatically once payment is detected.
            </p>
          </div>
        )}

        {/* ── Processing spinner ── */}
        {isProcessing && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={s.spinner} />
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12 }}>
              Processing your order… this usually takes under a minute.
            </p>
          </div>
        )}

        {/* ── Line items ── */}
        <div style={{ marginTop: 24 }}>
          <p style={s.sectionTitle}>Items</p>
          {items.map((item) => (
            <div key={item.id} style={s.itemRow}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>
                  {item.product_name}
                </p>
                <p style={{ margin: "2px 0 0", color: "#a78bfa", fontSize: 12 }}>
                  {item.variant_name} × {item.quantity}
                </p>
              </div>
              <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>
                ${(item.unit_price_usd * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Delivered keys ── */}
        {isDelivered && items.some((i) => i.delivery_keys?.length > 0) && (
          <div style={{ marginTop: 24 }}>
            <p style={s.sectionTitle}>🔑 Your Keys</p>
            {items.map((item) =>
              item.delivery_keys?.length > 0 ? (
                <div key={item.id} style={{ marginBottom: 16 }}>
                  <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>
                    {item.product_name} — {item.variant_name}
                  </p>
                  {item.delivery_keys.map((key, i) => (
                    <div key={i} style={s.keyRow}>
                      <code style={s.keyCode}>{key}</code>
                      <button style={s.copyBtn} onClick={() => copy(key, `${item.id}-${i}`)}>
                        {copied === `${item.id}-${i}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null
            )}
            <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
              Keys have also been sent to {order.email}
            </p>
          </div>
        )}

        {/* ── Delivery failure notice ── */}
        {order.status === "failed" && order.deliveryError && (
          <div style={s.errorBox}>
            <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>Delivery error:</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{order.deliveryError}</p>
            <p style={{ margin: "12px 0 0", fontSize: 12 }}>
              Contact support with order ID <strong>#{order.id}</strong> and we&apos;ll resolve this immediately.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, borderTop: "1px solid #1e293b", paddingTop: 20 }}>
          <a href="/account/orders" style={{ color: "#a78bfa", fontSize: 13, marginRight: 20 }}>
            All Orders
          </a>
          <a href="/" style={{ color: "#64748b", fontSize: 13 }}>
            Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight:      "100vh",
    display:        "flex",
    justifyContent: "center",
    alignItems:     "flex-start",
    padding:        "60px 16px 40px",
    background:     "#0d0d0d",
  },
  card: {
    width:          "100%",
    maxWidth:       560,
    background:     "#111827",
    border:         "1px solid #1e293b",
    borderRadius:   12,
    padding:        32,
  },
  h1: {
    fontSize:   24,
    fontWeight: 700,
    margin:     "0 0 8px",
  },
  meta: {
    background:   "#0d1117",
    borderRadius: 8,
    border:       "1px solid #1e293b",
    padding:      "12px 16px",
    marginBottom: 20,
  },
  metaRow: {
    display:       "flex",
    justifyContent:"space-between",
    alignItems:    "center",
    padding:       "6px 0",
    borderBottom:  "1px solid #1e293b",
  },
  metaLabel: {
    color:    "#64748b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  metaMono: {
    fontFamily: "monospace",
    color:      "#e2e8f0",
    fontSize:   13,
  },
  cryptoBox: {
    background:   "#0d1117",
    border:       "1px solid #1e293b",
    borderRadius: 8,
    padding:      "16px",
    marginBottom: 20,
  },
  cryptoLabel: {
    color:       "#94a3b8",
    fontSize:    12,
    margin:      "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  amountRow: {
    display:        "flex",
    alignItems:     "center",
    gap:            10,
    marginBottom:   14,
  },
  amount: {
    fontFamily:  "monospace",
    fontSize:    20,
    fontWeight:  700,
    color:       "#a78bfa",
  },
  addressRow: {
    display:     "flex",
    alignItems:  "center",
    gap:         8,
  },
  address: {
    fontFamily:  "monospace",
    fontSize:    12,
    color:       "#34d399",
    background:  "#0a0a0a",
    padding:     "6px 10px",
    borderRadius: 4,
    wordBreak:   "break-all",
    flex:        1,
  },
  copyBtn: {
    background:   "#1e293b",
    color:        "#e2e8f0",
    border:       "1px solid #334155",
    borderRadius: 6,
    padding:      "5px 10px",
    fontSize:     12,
    cursor:       "pointer",
    whiteSpace:   "nowrap",
  },
  sectionTitle: {
    color:        "#64748b",
    fontSize:     11,
    textTransform:"uppercase",
    letterSpacing:"0.08em",
    margin:       "0 0 10px",
    fontWeight:   600,
  },
  itemRow: {
    display:       "flex",
    justifyContent:"space-between",
    alignItems:    "center",
    padding:       "10px 0",
    borderBottom:  "1px solid #1e293b",
  },
  keyRow: {
    display:      "flex",
    alignItems:   "center",
    gap:          8,
    marginBottom: 8,
  },
  keyCode: {
    fontFamily:  "monospace",
    fontSize:    13,
    color:       "#34d399",
    background:  "#0a0a0a",
    padding:     "6px 10px",
    borderRadius: 4,
    wordBreak:   "break-all",
    flex:        1,
  },
  errorBox: {
    background:   "#1f0707",
    border:       "1px solid #7f1d1d",
    borderRadius: 8,
    padding:      16,
    color:        "#fca5a5",
    fontSize:     13,
    marginTop:    16,
  },
  spinner: {
    width:           32,
    height:          32,
    border:          "3px solid #1e293b",
    borderTop:       "3px solid #a78bfa",
    borderRadius:    "50%",
    animation:       "spin 0.8s linear infinite",
    display:         "inline-block",
  },
};
