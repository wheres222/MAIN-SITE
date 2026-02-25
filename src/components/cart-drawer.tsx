"use client";

import { useSyncExternalStore } from "react";
import {
  readCart,
  subscribeCart,
  writeCart,
  type CartStatus,
  type StoredCartLine,
} from "@/lib/cart";

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
  const lines = open ? cartLines : [];

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

  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

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
          <div className="checkout-total">
            <span>Total</span>
            <strong>USD {total.toFixed(2)}</strong>
          </div>
          <button className="checkout-btn" onClick={onClose}>
            Proceed To Checkout
          </button>
        </div>
      </div>
      {open && <button className="cart-overlay" onClick={onClose} aria-label="Close cart overlay" />}
    </>
  );
}
