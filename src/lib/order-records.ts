import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditReferral } from "@/lib/referrals";
import { getStorefrontData } from "@/lib/sellauth";
import { logger } from "@/lib/logger";
import type { CheckoutLineItemInput } from "@/types/sellauth";

/**
 * Order records for the SellAuth checkout path.
 *
 * Nothing used to write one. When SellAuth is configured the checkout route
 * hands the buyer straight to SellAuth and returns, so no row was created in
 * `shop_orders`, and the SellAuth webhook only recorded a delivery-dedupe
 * marker. The three account pages read `orders`, which nothing populated —
 * so a customer's purchases were invisible to them, and creditReferral() was
 * unreachable on the only checkout path production actually uses.
 *
 * `orders` is the right table for this, not `shop_orders`. It carries
 * `sellauth_order_id` (the join key the webhook gives us) and denormalised
 * product name/price, where shop_order_items has NOT NULL foreign keys into
 * shop_products and shop_variants — rows that do not exist when the catalogue
 * is served from SellAuth rather than Supabase.
 */

/**
 * Write one `orders` row per cart line, pending payment.
 *
 * Never throws. A failure to record an order must not stop the customer
 * reaching the payment page — an unrecorded order is recoverable from
 * SellAuth's own dashboard, a blocked checkout is lost revenue.
 */
export async function recordSellAuthOrder(params: {
  userId: string | null;
  invoiceId: string | null;
  items: CheckoutLineItemInput[];
}): Promise<void> {
  const { userId, invoiceId, items } = params;

  // `orders.user_id` is NOT NULL and references profiles — a guest checkout has
  // no account to attach to. SellAuth still has the order; there is simply no
  // dashboard to show it in.
  if (!userId) return;

  if (!invoiceId) {
    logger.warn("SellAuth checkout returned no invoice id — order not recorded", {
      route: "orders/record",
      userId,
    });
    return;
  }

  try {
    const storefront = await getStorefrontData();

    const rows = items.map((item) => {
      const product = storefront.products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);

      const unitPrice =
        (typeof variant?.price === "number" ? variant.price : null) ??
        (typeof product?.price === "number" ? product.price : 0);

      return {
        user_id: userId,
        sellauth_order_id: invoiceId,
        product_name: variant?.name
          ? `${product?.name ?? "Product"} — ${variant.name}`
          : product?.name ?? `Product ${item.productId}`,
        product_image: product?.image ?? null,
        amount: Math.round(unitPrice * item.quantity * 100) / 100,
        currency: product?.currency || "USD",
        status: "pending",
      };
    });

    const { error } = await createAdminClient().from("orders").insert(rows);

    if (error) {
      logger.error("Failed to record SellAuth order", {
        route: "orders/record",
        invoiceId,
        err: error.message,
      });
      return;
    }

    logger.info("Recorded SellAuth order", {
      route: "orders/record",
      invoiceId,
      lines: rows.length,
    });
  } catch (err) {
    logger.error("Recording SellAuth order threw", {
      route: "orders/record",
      invoiceId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Mark a recorded order paid and pay any referral commission on it.
 *
 * Called from the SellAuth webhook once the order completes. The status filter
 * is the idempotency guard: SellAuth retries webhooks, and a second delivery
 * updates zero rows, so the commission is paid exactly once.
 *
 * Never throws, for the same reason as above — a bookkeeping failure must not
 * stop the customer receiving what they paid for.
 */
export async function completeSellAuthOrder(invoiceId: string): Promise<void> {
  if (!invoiceId) return;

  try {
    const admin = createAdminClient();

    const { data: updated, error } = await admin
      .from("orders")
      .update({ status: "completed" })
      .eq("sellauth_order_id", invoiceId)
      .eq("status", "pending")
      .select("id, user_id, amount");

    if (error) {
      logger.error("Failed to complete SellAuth order", {
        route: "orders/complete",
        invoiceId,
        err: error.message,
      });
      return;
    }

    if (!updated || updated.length === 0) {
      // Either the order was never recorded (guest checkout) or this webhook is
      // a retry of one already completed. Both are fine; neither should pay a
      // commission a second time.
      logger.info("No pending order matched — nothing to complete", {
        route: "orders/complete",
        invoiceId,
      });
      return;
    }

    const userId = updated[0].user_id as string;
    const total =
      Math.round(
        updated.reduce((sum, row) => sum + Number(row.amount ?? 0), 0) * 100
      ) / 100;

    await creditReferral(admin, userId, invoiceId, total);

    logger.info("Completed SellAuth order", {
      route: "orders/complete",
      invoiceId,
      lines: updated.length,
      total,
    });
  } catch (err) {
    logger.error("Completing SellAuth order threw", {
      route: "orders/complete",
      invoiceId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
