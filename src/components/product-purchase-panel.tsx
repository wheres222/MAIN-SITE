"use client";

import { useMemo, useState } from "react";
import type { SellAuthPaymentMethod, SellAuthProduct } from "@/types/sellauth";

interface ProductPurchasePanelProps {
  product: SellAuthProduct;
  paymentMethods: SellAuthPaymentMethod[];
}

function money(value: number | null, currency = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function unitPrice(product: SellAuthProduct, variantId?: number): number {
  if (variantId) {
    const found = product.variants.find((item) => item.id === variantId);
    if (found?.price !== null && found?.price !== undefined) return found.price;
  }
  if (product.price !== null && product.price !== undefined) return product.price;
  if (product.variants[0]?.price !== null && product.variants[0]?.price !== undefined) {
    return product.variants[0].price;
  }
  return 0;
}

export function ProductPurchasePanel({
  product,
  paymentMethods,
}: ProductPurchasePanelProps) {
  const [variantId, setVariantId] = useState<number | undefined>(
    product.variants[0]?.id
  );
  const minQuantity = /mail/i.test(product.name) ? 25 : 1;
  const [quantity, setQuantity] = useState(minQuantity);
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethods[0]?.id || "crypto"
  );
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const total = useMemo(
    () => unitPrice(product, variantId) * quantity,
    [product, quantity, variantId]
  );

  async function handleCheckout() {
    setMessage("");
    setIsBusy(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          email: email.trim() || undefined,
          couponCode: couponCode.trim() || undefined,
          items: [
            {
              productId: product.id,
              quantity,
              ...(variantId ? { variantId } : {}),
            },
          ],
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        redirectUrl?: string | null;
      };
      if (!response.ok || !data.success) {
        setMessage(data.message || "Checkout failed.");
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setMessage(data.message || "Checkout created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <aside className="product-buy-box">
      <h3>Purchase</h3>
      <p className="buy-price">{money(unitPrice(product, variantId), product.currency)}</p>

      {product.variants.length > 0 && (
        <label>
          Variant
          <select
            value={variantId || ""}
            onChange={(event) => setVariantId(Number(event.target.value) || undefined)}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} - {money(variant.price, product.currency)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Quantity
        <input
          type="number"
          min={minQuantity}
          value={quantity}
          onChange={(event) =>
            setQuantity(Math.max(minQuantity, Number(event.target.value) || minQuantity))
          }
        />
      </label>

      {minQuantity > 1 ? (
        <div className="qty-presets" aria-label="Quick quantity presets">
          {[25, 50, 100].map((value) => (
            <button
              key={value}
              type="button"
              className={`qty-preset-btn ${quantity === value ? "active" : ""}`}
              onClick={() => setQuantity(value)}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}

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
          {paymentMethods.length === 0 && <option value="crypto">Crypto</option>}
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

      <div className="buy-total">
        <span>Total</span>
        <strong>{money(total, product.currency)}</strong>
      </div>

      <button className="checkout-btn" onClick={handleCheckout} disabled={isBusy}>
        {isBusy ? "Processing..." : "Checkout Now"}
      </button>

      {message ? <p className="checkout-message">{message}</p> : null}
    </aside>
  );
}
