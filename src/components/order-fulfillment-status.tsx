"use client";

import Image from "next/image";
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
      return "Payment successful";
    case "failed":
      return "Payment failed";
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
  const [invoiceEmail, setInvoiceEmail] = useState(mockData?.customerEmail || "");
  const [invoiceNotice, setInvoiceNotice] = useState("");

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

  function submitInvoiceEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!invoiceEmail.trim()) {
      setInvoiceNotice("Please enter an email address.");
      return;
    }
    setInvoiceNotice("Invoice email request received.");
  }

  return (
    <section className="order-complete-shell receipt-style-shell">
      <div className="receipt-card">
        <header className="receipt-card-top">
          <div className="receipt-brand-left">
            <Image src="/branding/cp-logo.png" alt="CheatParadise" width={30} height={30} />
          </div>
          <div className="receipt-brand-right">
            <h1>CheatParadise</h1>
            <p>
              For any help: <a href={process.env.NEXT_PUBLIC_SUPPORT_URL || "https://discord.gg/yourserver"} target="_blank" rel="noreferrer">Support</a>
            </p>
          </div>
        </header>

        <div className="receipt-state-wrap">
          <span className={`receipt-check-badge receipt-check-${order?.status || "unknown"}`}>
            ✓
          </span>
          <h2>{statusLabel(order?.status || "processing")}</h2>
          <p>
            {order?.status === "failed"
              ? "We couldn't finish this payment. Please contact support."
              : "Thank you! Your payment was successfully processed."}
          </p>
        </div>

        <article className="receipt-summary-box">
          <div>
            <span>Amount Paid</span>
            <strong>{mockData?.total || "—"}</strong>
          </div>
          <div>
            <span>Transaction ID</span>
            <strong>{mockData?.transactionId || order?.orderId || orderId}</strong>
          </div>
        </article>

        <form className="receipt-invoice-form" onSubmit={submitInvoiceEmail}>
          <label htmlFor="invoice-email">Enter email address to receive invoice</label>
          <input
            id="invoice-email"
            value={invoiceEmail}
            onChange={(event) => setInvoiceEmail(event.target.value)}
            placeholder="abc@email.com"
            type="email"
          />
          <button type="submit">Submit</button>
          {invoiceNotice ? <p className="receipt-invoice-notice">{invoiceNotice}</p> : null}
        </form>

        <div className="receipt-delivery-block">
          <h3>Delivered items</h3>
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
        </div>

        {loading ? <p className="state-message">Loading order status...</p> : null}
        {error ? <p className="state-message error">{error}</p> : null}

        <footer className="receipt-footer-links">
          <Link href="/terms-of-service">Terms</Link>
          <span>&</span>
          <Link href="/privacy-policy">Privacy</Link>
        </footer>
      </div>
    </section>
  );
}
