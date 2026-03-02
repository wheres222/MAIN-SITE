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

interface Props {
  orderId: string;
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "fulfilled":
      return "Fulfilled";
    case "failed":
      return "Failed";
    default:
      return status || "Unknown";
  }
}

export function OrderFulfillmentStatus({ orderId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderPayload["order"] | null>(null);

  useEffect(() => {
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
  }, [orderId, order?.status]);

  const done = useMemo(
    () => order?.status === "fulfilled" || order?.status === "failed",
    [order?.status]
  );

  return (
    <section className="order-status-card">
      <h1>Order Fulfillment</h1>
      <p className="order-id">Order: {orderId}</p>

      {loading ? <p className="state-message">Loading order status...</p> : null}
      {error ? <p className="state-message error">{error}</p> : null}

      {order ? (
        <>
          <div className="order-status-pill-wrap">
            <span className={`order-status-pill order-status-${order.status || "unknown"}`}>
              {statusLabel(order.status || "unknown")}
            </span>
            {order.updatedAt ? (
              <span className="order-updated">Updated: {new Date(order.updatedAt).toLocaleString()}</span>
            ) : null}
          </div>

          {Array.isArray(order.licenseKeys) && order.licenseKeys.length > 0 ? (
            <div className="order-keys-wrap">
              <h2>License Keys</h2>
              <ul>
                {order.licenseKeys.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="state-message">
              {done
                ? "No keys were attached to this order."
                : "Keys will appear here automatically once fulfillment is complete."}
            </p>
          )}

          {order.status === "failed" && order.lastError ? (
            <p className="state-message error">{order.lastError}</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
