"use client";

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
  subtitle?: string;
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
        const response = await fetch(
          `/api/fulfillment/order?orderId=${encodeURIComponent(orderId)}`,
          {
            cache: "no-store",
          }
        );
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

  const keys = order?.licenseKeys || [];
  const primaryKey = keys[0] || "Pending delivery...";
  const primaryItem = items[0];

  const isFailed = order?.status === "failed";
  const isPaid = order?.status === "fulfilled";

  const successTitle = isFailed
    ? "Payment failed"
    : isPaid
      ? "Payment successful"
      : "Payment processing";

  const successMessage = isFailed
    ? "We couldn't complete this payment. Please contact support."
    : isPaid
      ? "Thank you for your purchase. Your order is being delivered automatically."
      : "Thanks for your payment. We are currently processing your order delivery.";

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
      <div className="postpay-card">
        <header className="postpay-top">
          <span className={`postpay-top-icon ${isFailed ? "is-failed" : ""}`}>✓</span>
          <h2>{successTitle}</h2>
          <p>{successMessage}</p>
        </header>

        <div className="postpay-separator" />

        <div className="postpay-content">
          <article className="postpay-block">
            <h3>Order details</h3>
            <dl className="postpay-details">
              <div>
                <dt>Product:</dt>
                <dd>{primaryItem?.name || "Digital Product"}</dd>
              </div>
              <div>
                <dt>Order:</dt>
                <dd>{order?.orderId || orderId}</dd>
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
              <div>
                <dt>Status:</dt>
                <dd className="postpay-status-inline">{formatStatus(order?.status || "processing")}</dd>
              </div>
              {mockData?.transactionId ? (
                <div>
                  <dt>Transaction:</dt>
                  <dd>{mockData.transactionId}</dd>
                </div>
              ) : null}
            </dl>
          </article>

          <article className="postpay-block">
            <h3>Your keys</h3>

            <div className="postpay-primary-key">
              <span>{primaryKey}</span>
              <button type="button" onClick={() => copyKey(primaryKey)}>
                {copiedKey === primaryKey ? "Copied" : "Copy"}
              </button>
            </div>

            {keys.length > 1 ? (
              <ul className="postpay-key-list">
                {keys.slice(1).map((key) => (
                  <li key={key}>
                    <span>{key}</span>
                    <button type="button" onClick={() => copyKey(key)}>
                      {copiedKey === key ? "Copied" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="postpay-actions">
              <a href="#">Instructions and loader</a>
              <a
                href={process.env.NEXT_PUBLIC_SUPPORT_URL || "https://discord.gg/yourserver"}
                target="_blank"
                rel="noreferrer"
              >
                Help
              </a>
            </div>

            {copiedKey === "copy-failed" ? (
              <p className="state-message error">Copy failed on this device.</p>
            ) : null}
          </article>
        </div>

        {loading ? <p className="state-message">Loading order status...</p> : null}
        {error ? <p className="state-message error">{error}</p> : null}
        {order?.status === "failed" && order.lastError ? (
          <p className="state-message error">{order.lastError}</p>
        ) : null}
      </div>
    </section>
  );
}
