"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  readCart,
  subscribeCart,
  writeCart,
  type CartStatus,
  type StoredCartLine,
} from "@/lib/cart";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { SellAuthPaymentMethod } from "@/types/sellauth";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: CartStatus[] = ["undetected", "updating", "detected"];
const EMPTY_CART_LINES: StoredCartLine[] = [];

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const cartLines = useSyncExternalStore(
    subscribeCart,
    readCart,
    () => EMPTY_CART_LINES
  );
  const lines = open ? cartLines : EMPTY_CART_LINES;

  const [paymentMethods, setPaymentMethods] = useState<SellAuthPaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("crypto");
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    let alive = true;
    (async () => {
      try {
        const storefront = await fetchStorefrontClient();
        if (!alive) return;

        const methods = storefront.paymentMethods || [];
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setPaymentMethod(methods[0].id);
        }
      } catch {
        if (!alive) return;
        setPaymentMethods([]);
        setPaymentMethod("crypto");
      }
    })();

    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMessage("");
    }
  }, [open]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines]
  );

  function updateLines(next: StoredCartLine[]) {
    writeCart(next);
  }

  function removeLine(id: string) {
    updateLines(lines.filter((line) => line.lineId !== id));
  }

  function changeStatus(id: string, status: CartStatus) {
    updateLines(
      lines.map((line) => (line.lineId === id ? { ...line, status } : line))
    );
  }

  function changeQty(id: string, delta: number) {
    updateLines(
      lines
        .map((line) =>
          line.lineId === id
            ? { ...line, quantity: Math.max(1, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  async function proceedToCheckout() {
    if (lines.length === 0 || isBusy) return;

    setMessage("");
    setIsBusy(true);

    try {
      const idempotencyKey = [
        paymentMethod.trim().toLowerCase(),
        email.trim().toLowerCase(),
        couponCode.trim().toLowerCase(),
        ...lines
          .map((line) => `${line.productId}:${line.variantId || 0}:${line.quantity}`)
          .sort(),
      ].join("|");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          paymentMethod,
          email: email.trim() || undefined,
          couponCode: couponCode.trim() || undefined,
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            ...(line.variantId ? { variantId: line.variantId } : {}),
          })),
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        redirectUrl?: string | null;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.message || "Checkout failed.");
        return;
      }

      if (payload.redirectUrl) {
        setMessage("Redirecting to secure checkout...");
        window.location.href = payload.redirectUrl;
        return;
      }

      setMessage(payload.message || "Checkout created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <div className={`cart-drawer ${open ? "open" : ""}`}>
        <header>
          <h3>Cart</h3>
          <button onClick={onClose}>Close</button>
        </header>

        <div className="cart-lines">
          {lines.length === 0 && <p className="state-message">Cart is empty.</p>}
          {lines.map((line) => (
            <article key={line.lineId} className="cart-line">
              {/* Product images may come from user-configured external hosts. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={line.image} alt={line.productName} />
              <div>
                <h4>{line.productName}</h4>
                {line.variantName ? <p>{line.variantName}</p> : null}
                <div className="cart-status-row">
                  <label htmlFor={`status-${line.lineId}`}>Status</label>
                  <select
                    id={`status-${line.lineId}`}
                    value={line.status}
                    onChange={(event) =>
                      changeStatus(line.lineId, event.target.value as CartStatus)
                    }
                    className="cart-status-select"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="qty">
                  <button onClick={() => changeQty(line.lineId, -1)}>-</button>
                  <span>{line.quantity}</span>
                  <button onClick={() => changeQty(line.lineId, 1)}>+</button>
                </div>
                <p className="checkout-total">
                  <strong>
                    {line.currency} {(line.unitPrice * line.quantity).toFixed(2)}
                  </strong>
                </p>
                <button className="remove" onClick={() => removeLine(line.lineId)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="checkout-form">
          <label>
            Payment Method
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
              {paymentMethods.length === 0 ? <option value="crypto">Crypto</option> : null}
            </select>
          </label>

          <label>
            Email (optional)
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Coupon (optional)
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Coupon code"
            />
          </label>

          <p className="cart-persist-note">
            Cart is saved locally, so your items stay even if you close this tab.
          </p>

          <div className="checkout-total">
            <span>Total</span>
            <strong>USD {total.toFixed(2)}</strong>
          </div>
          <button
            className="checkout-btn"
            onClick={proceedToCheckout}
            disabled={lines.length === 0 || isBusy}
          >
            {isBusy ? "Processing..." : "Proceed To Checkout"}
          </button>
          {message ? <p className="checkout-message">{message}</p> : null}
        </div>
      </div>
      {open && <button className="cart-overlay" onClick={onClose} aria-label="Close cart overlay" />}
    </>
  );
}
