"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderStatus = "queued" | "processing" | "fulfilled" | "failed" | string;

interface OrderPayload {
  success?: boolean;
  message?: string;
  order?: {
    orderId: string;
    status: OrderStatus;
    updatedAt?: string;
    licenseKeys?: string[];
    lastError?: string;
  };
}

interface OrderItemView {
  name: string;
  quantity: number;
  note?: string;
}

interface MockOrderData {
  orderId: string;
  status: OrderStatus;
  updatedAt?: string;
  licenseKeys?: string[];
  lastError?: string;
  paymentMethod?: string;
  total?: string;
  customerEmail?: string;
  items?: OrderItemView[];
  transactionId?: string;
}

interface Props {
  orderId: string;
  mockData?: MockOrderData;
}

function formatStatus(status: OrderStatus): string {
  switch (status) {
    case "queued":
      return "queued";
    case "processing":
      return "processing";
    case "fulfilled":
      return "paid";
    case "failed":
      return "failed";
    default:
      return status || "unknown";
  }
}

export function OrderFulfillmentStatus({ orderId, mockData }: Props) {
  const [loading, setLoading] = useState(!mockData);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderPayload["order"] | null>(
    mockData
      ? {
          orderId: mockData.orderId,
          status: mockData.status,
          updatedAt: mockData.updatedAt,
          licenseKeys: mockData.licenseKeys,
          lastError: mockData.lastError,
        }
      : null
  );
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    if (mockData) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      try {
        const response = await fetch(`/api/fulfillment/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as OrderPayload;

        if (!alive) return;

        if (!response.ok || !payload.success || !payload.order) {
          setError(payload.message || "Order not found yet.");
          setOrder(null);
        } else {
          setError("");
          setOrder(payload.order);
        }
      } catch (requestError) {
        if (!alive) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to fetch order status."
        );
      } finally {
        if (!alive) return;
        setLoading(false);

        if (order?.status !== "fulfilled" && order?.status !== "failed") {
          timer = setTimeout(run, 3000);
        }
      }
    }

    run();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [mockData, order?.status, orderId]);

  const items = useMemo(
    () =>
      mockData?.items || [
        {
          name: "Digital Product",
          quantity: 1,
          note: "Auto delivery enabled",
        },
      ],
    [mockData?.items]
  );

  const primaryItem = items[0];
  const totalUnits = useMemo(
    () => items.reduce((acc, item) => acc + Math.max(1, item.quantity || 1), 0),
    [items]
  );

  const keys = order?.licenseKeys || [];

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(value);
      setTimeout(() => setCopiedKey(""), 1400);
    } catch {
      setCopiedKey("copy-failed");
      setTimeout(() => setCopiedKey(""), 1400);
    }
  }

  return (
    <section className="postpay-shell">
      <div className="postpay-grid">
        <article className="postpay-left">
          <h1>{primaryItem?.name || "Order completed"}</h1>
          {primaryItem?.note ? <p className="postpay-sub">{primaryItem.note}</p> : null}

          <dl className="postpay-details">
            <div>
              <dt>Order:</dt>
              <dd>{order?.orderId || orderId}</dd>
            </div>
            <div>
              <dt>Amount:</dt>
              <dd>{totalUnits}</dd>
            </div>
            <div>
              <dt>Total:</dt>
              <dd>{mockData?.total || "—"}</dd>
            </div>
            <div>
              <dt>Time of purchase:</dt>
              <dd>{order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : "Pending"}</dd>
            </div>
            <div>
              <dt>Email:</dt>
              <dd>{mockData?.customerEmail || "Not provided"}</dd>
            </div>
            <div>
              <dt>Payment method:</dt>
              <dd>{mockData?.paymentMethod || "Crypto"}</dd>
            </div>
          </dl>

          <p className="postpay-status">
            Payment status: <strong>{formatStatus(order?.status || "processing")}</strong>
          </p>

          {mockData?.transactionId ? (
            <p className="postpay-bonus">Transaction: {mockData.transactionId}</p>
          ) : null}

          <div className="postpay-personal-box">Personal</div>
          <p className="postpay-personal-note">
            A personal account is created automatically upon the first purchase.
          </p>

          {loading ? <p className="state-message">Loading order status...</p> : null}
          {error ? <p className="state-message error">{error}</p> : null}
          {order?.status === "failed" && order.lastError ? (
            <p className="state-message error">{order.lastError}</p>
          ) : null}
        </article>

        <article className="postpay-right">
          <h2>Your keys:</h2>

          {keys.length > 0 ? (
            <ul className="postpay-key-list">
              {keys.map((key) => (
                <li key={key}>
                  <span>{key}</span>
                  <button type="button" onClick={() => copyKey(key)}>
                    {copiedKey === key ? "Copied" : "Copy"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="state-message">No keys yet. Delivery will appear here automatically.</p>
          )}

          <div className="postpay-actions">
            <a href="#">Instructions and loader</a>
            <a href={process.env.NEXT_PUBLIC_SUPPORT_URL || "https://discord.gg/yourserver"} target="_blank" rel="noreferrer">
              Help
            </a>
            <Link href="/">Store</Link>
          </div>

          {copiedKey === "copy-failed" ? (
            <p className="state-message error">Copy failed on this device.</p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
