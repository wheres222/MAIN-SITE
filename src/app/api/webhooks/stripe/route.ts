import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { constructStripeEvent } from "@/lib/stripe";
import { deliverOrder } from "@/lib/delivery";
import { sendOrderKeysEmail, sendOrderDeliveredEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// ── Webhook entry point ───────────────────────────────────────────────────────
//
// Security model:
//   1. HMAC-SHA256 signature verified via Stripe SDK before ANY DB access
//   2. Only fire fulfillment on checkout.session.completed where payment_status === "paid"
//   3. Optimistic DB lock (.eq("status", "pending")) prevents double-fulfillment
//   4. Refund / failure events explicitly mark orders so we never re-deliver
//
// In Next.js App Router, request.text() always gives the raw body — no special
// bodyParser config needed (that's Pages Router only).

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Misconfigured — log loudly and reject so Stripe retries when fixed
    logger.warn("STRIPE_WEBHOOK_SECRET not set — rejecting webhook", {});
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Raw body required for HMAC verification
  const rawBody  = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.warn("Stripe signature verification failed", { err: String(err) });
    // Return 401 so Stripe knows this is a permanent rejection (not a retry)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    // ── Payment succeeded ────────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // payment_status must be "paid" — "unpaid" = bank transfer pending, skip
      if (session.payment_status !== "paid") {
        return NextResponse.json({ ok: true });
      }

      const orderId = session.metadata?.shop_order_id;
      if (!orderId) {
        logger.warn("checkout.session.completed: missing shop_order_id in metadata", {
          sessionId: session.id,
        });
        return NextResponse.json({ ok: true });
      }

      return fulfillShopOrder(orderId, session.customer_email ?? null, admin);
    }

    // ── Async payment failed (bank transfers, etc.) ──────────────────────────
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.shop_order_id;
      if (orderId) {
        await admin
          .from("shop_orders")
          .update({
            status:         "failed",
            delivery_error: "Stripe payment failed",
            updated_at:     new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("status", "pending");
        logger.info("Order marked failed — async payment failed", { orderId });
      }
      return NextResponse.json({ ok: true });
    }

    // ── Refund issued ────────────────────────────────────────────────────────
    case "charge.refunded": {
      const charge   = event.data.object as Stripe.Charge;
      const orderId  = charge.metadata?.shop_order_id ?? (charge.payment_intent as string | null);

      if (orderId) {
        // Only flip to refunded if currently delivered — don't overwrite failed
        await admin
          .from("shop_orders")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .in("status", ["paid", "delivered"]);
        logger.info("Order marked refunded", { orderId });
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}

// ── Fulfillment ───────────────────────────────────────────────────────────────

async function fulfillShopOrder(
  orderId: string,
  sessionEmail: string | null,
  admin: ReturnType<typeof createAdminClient>
) {
  // Fetch order — single() will error if not found
  const { data: order, error } = await admin
    .from("shop_orders")
    .select("id, user_id, email, status, total_usd")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    // Could be a race — return 200 so Stripe doesn't retry endlessly
    logger.error("Stripe webhook: order not found", { orderId });
    return NextResponse.json({ ok: true });
  }

  // Idempotency guard — already fulfilled on a previous webhook delivery
  if (order.status !== "pending") {
    logger.info("Order already processed — skipping", { orderId, status: order.status });
    return NextResponse.json({ ok: true });
  }

  // Atomic transition: pending → paid (only if still pending)
  // If two webhook deliveries race, only one will match the .eq("status","pending") clause
  const { error: lockErr } = await admin
    .from("shop_orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");

  if (lockErr) {
    logger.error("Failed to acquire order lock", { orderId, err: String(lockErr) });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  logger.info("Stripe payment confirmed — beginning fulfillment", { orderId });

  // ── Fetch line items ────────────────────────────────────────────────────────
  const { data: items } = await admin
    .from("shop_order_items")
    .select("id, variant_id, variant_name, product_name, quantity")
    .eq("order_id", orderId);

  if (!items || items.length === 0) {
    await admin
      .from("shop_orders")
      .update({ status: "failed", delivery_error: "No order items found", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    logger.error("No items found for paid order", { orderId });
    return NextResponse.json({ ok: true });
  }

  // ── Mark delivering ─────────────────────────────────────────────────────────
  await admin
    .from("shop_orders")
    .update({ status: "delivering", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  const deliveryEmail  = order.email || sessionEmail || "";
  const deliveryErrors: string[] = [];
  const deliveredKeys: { itemName: string; keys: string[]; instructions: string; loaderUrl: string }[] = [];

  for (const item of items) {
    // Get variant details including reselling.pro product ID
    const { data: variant } = await admin
      .from("shop_variants")
      .select("reselling_product_id, sellauth_id")
      .eq("id", item.variant_id)
      .single();

    // Get product instructions + loader URL
    const { data: itemProduct } = await admin
      .from("shop_order_items")
      .select("product_id")
      .eq("id", item.id)
      .single();

    let instructions = "";
    let loaderUrl    = "";

    if (itemProduct?.product_id) {
      const { data: productDetails } = await admin
        .from("shop_products")
        .select("instructions, loader_url")
        .eq("id", itemProduct.product_id)
        .single();
      instructions = productDetails?.instructions ?? "";
      loaderUrl    = productDetails?.loader_url    ?? "";
    }

    const resellingProductId =
      variant?.reselling_product_id || variant?.sellauth_id || null;

    if (!resellingProductId) {
      const msg = `No reselling.pro product ID for variant "${item.variant_name}"`;
      logger.error(msg, { orderId });
      deliveryErrors.push(msg);
      continue;
    }

    const itemKeys: string[] = [];

    for (let unit = 0; unit < item.quantity; unit++) {
      const result = await deliverOrder(resellingProductId, deliveryEmail);

      if (!result.success) {
        const msg = `Delivery failed for "${item.variant_name}" (unit ${unit + 1}): ${result.message}`;
        logger.error(msg, { orderId });
        deliveryErrors.push(msg);
      } else {
        const keyToStore = result.key ?? result.deliveryId ?? "delivered";
        itemKeys.push(keyToStore);
        try {
          await admin.rpc("append_delivery_key", {
            p_item_id:     item.id,
            p_delivery_id: keyToStore,
          });
        } catch {/* non-fatal */}
      }
    }

    if (itemKeys.length > 0) {
      deliveredKeys.push({
        itemName:     `${item.product_name} — ${item.variant_name}`,
        keys:         itemKeys,
        instructions,
        loaderUrl,
      });
    }
  }

  // ── Final status ────────────────────────────────────────────────────────────
  const finalStatus = deliveryErrors.length === 0 ? "delivered" : "failed";
  await admin
    .from("shop_orders")
    .update({
      status:         finalStatus,
      delivery_error: deliveryErrors.length > 0 ? deliveryErrors.join(" | ") : null,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", orderId);

  logger.info(`Order ${finalStatus}`, { orderId, errorCount: deliveryErrors.length });

  // ── Send delivery email ─────────────────────────────────────────────────────
  if (deliveryEmail) {
    if (finalStatus === "delivered" && deliveredKeys.length > 0) {
      sendOrderKeysEmail(deliveryEmail, orderId, deliveredKeys).catch((e) =>
        logger.error("Keys email failed", { orderId, err: String(e) })
      );
    } else {
      sendOrderDeliveredEmail(deliveryEmail, orderId).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
