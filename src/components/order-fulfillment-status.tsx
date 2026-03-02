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

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "fulfilled":
      return "Delivered";
    case "failed":
      return "Failed";
    default:
      return status || "Unknown";
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

  const done = useMemo(
    () => order?.status === "fulfilled" || order?.status === "failed",
    [order?.status]
  );

  const items = mockData?.items || [
    {
      name: "Digital Product",
      quantity: 1,
      note: "Delivered automatically after payment confirmation",
    },
  ];

  return (
    <section className="order-complete-shell">
      <header className="order-complete-header">
        <div className="order-complete-header-left">
          <span className="order-complete-check" aria-hidden="true">
            ✓
          </span>
          <div>
            <h1>Payment Completed</h1>
            <p>Your order is being processed and delivered automatically.</p>
          </div>
        </div>

        <div className="order-complete-header-right">
          <span className={`order-status-pill order-status-${order?.status || "unknown"}`}>
            {statusLabel(order?.status || "unknown")}
          </span>
          <span className="order-id">Order #{order?.orderId || orderId}</span>
        </div>
      </header>

      {loading ? <p className="state-message">Loading order status...</p> : null}
      {error ? <p className="state-message error">{error}</p> : null}

      <div className="order-complete-grid">
        <article className="order-panel">
          <h2>Order Summary</h2>
          <ul className="order-summary-list">
            {items.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <div>
                  <strong>{item.name}</strong>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
                <span>x{item.quantity}</span>
              </li>
            ))}
          </ul>

          <div className="order-meta-grid">
            <div>
              <span>Payment Method</span>
              <strong>{mockData?.paymentMethod || "Crypto"}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{mockData?.total || "—"}</strong>
            </div>
            <div>
              <span>Customer</span>
              <strong>{mockData?.customerEmail || "—"}</strong>
            </div>
            <div>
              <span>Last Update</span>
              <strong>
                {order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : "Pending"}
              </strong>
            </div>
          </div>

          {mockData?.transactionId ? (
            <p className="order-transaction">Transaction: {mockData.transactionId}</p>
          ) : null}
        </article>

        <article className="order-panel order-panel-delivery">
          <h2>Delivery</h2>
          {Array.isArray(order?.licenseKeys) && order.licenseKeys.length > 0 ? (
            <ul className="order-keys-list">
              {order.licenseKeys.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          ) : (
            <p className="state-message">
              {done
                ? "No keys were attached to this order."
                : "Your license key(s) will appear here as soon as fulfillment completes."}
            </p>
          )}

          {order?.status === "failed" && order.lastError ? (
            <p className="state-message error">{order.lastError}</p>
          ) : null}

          <div className="order-actions">
            <Link href="/">Back to Store</Link>
            <a href={process.env.NEXT_PUBLIC_SUPPORT_URL || "https://discord.gg/yourserver"} target="_blank" rel="noreferrer">
              Need Support?
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
