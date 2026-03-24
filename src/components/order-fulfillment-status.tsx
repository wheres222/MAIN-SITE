"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OrderStatus = "queued" | "processing" | "fulfilled" | "failed" | string;

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
  token?: string;
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

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000; // stop polling after 10 minutes

export function OrderFulfillmentStatus({ orderId, token, mockData }: Props) {
  const [copiedKey, setCopiedKey] = useState("");
  const [liveStatus, setLiveStatus] = useState<"pending" | "processing" | "ready" | "failed" | null>(null);
  const [pollError, setPollError] = useState("");
  const pollStartRef = useRef(Date.now());

  useEffect(() => {
    // Only poll when we have a real orderId and token — skip for mock/demo data.
    if (mockData || !orderId || !token) return;

    pollStartRef.current = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token!)}`);
        if (!res.ok) {
          setPollError("Could not reach order status. Please contact support.");
          return;
        }
        const json = (await res.json()) as { status: string; error?: string };
        if (json.status === "ready") {
          setLiveStatus("ready");
          return; // stop polling
        }
        if (json.status === "failed") {
          setLiveStatus("failed");
          setPollError(json.error || "Delivery failed. Please contact support.");
          return; // stop polling
        }
        if (json.status === "processing") {
          setLiveStatus("processing");
        } else {
          setLiveStatus("pending");
        }
      } catch {
        // Network hiccup — keep polling silently.
      }

      if (Date.now() - pollStartRef.current < POLL_TIMEOUT_MS) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        setPollError("Order is taking longer than expected. Please contact support.");
      }
    }

    // Start first poll immediately.
    void poll();

    return () => clearTimeout(timer);
  }, [orderId, token, mockData]);

  const order =
    mockData
      ? {
          orderId: mockData.orderId,
          status: mockData.status,
          updatedAt: mockData.updatedAt,
          licenseKeys: mockData.licenseKeys,
          lastError: mockData.lastError,
        }
      : {
          orderId,
          status: liveStatus === "ready" ? "fulfilled" : liveStatus === "failed" ? "failed" : "processing",
          updatedAt: new Date().toISOString(),
          licenseKeys: [] as string[],
          lastError: pollError || undefined,
        };

  const error = (!mockData && !token)
    ? "Order tracking link is missing a token. Please open this page from your checkout confirmation link."
    : pollError;

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

  const keys = order.licenseKeys || [];
  const primaryItem = items[0];

  const isFailed = order.status === "failed";
  const isPaid = order.status === "fulfilled";
  const canShowDelivery = isPaid && keys.length > 0;

  const successTitle = isFailed
    ? "Payment failed"
    : isPaid
      ? "Payment successful"
      : "Payment processing";

  const successMessage = isFailed
    ? "We couldn't complete this payment. Please contact support."
    : canShowDelivery
      ? "Payment verified. Your delivery details are ready below."
      : "Your payment is being processed.";

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
                <dd>{order.orderId || orderId}</dd>
              </div>
              <div>
                <dt>Total:</dt>
                <dd>{mockData?.total || "—"}</dd>
              </div>
              <div>
                <dt>Time of purchase:</dt>
                <dd>{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "Pending"}</dd>
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
                <dd className="postpay-status-inline">{formatStatus(order.status || "processing")}</dd>
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

            {canShowDelivery ? (
              <>
                <div className="postpay-primary-key">
                  <span>{keys[0]}</span>
                  <button type="button" onClick={() => copyKey(keys[0])}>
                    {copiedKey === keys[0] ? "Copied" : "Copy"}
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
              </>
            ) : null}

            {copiedKey === "copy-failed" ? (
              <p className="state-message error">Copy failed on this device.</p>
            ) : null}
          </article>
        </div>

        {error ? <p className="state-message error">{error}</p> : null}
        {order.status === "failed" && order.lastError ? (
          <p className="state-message error">{order.lastError}</p>
        ) : null}
      </div>
    </section>
  );
}
