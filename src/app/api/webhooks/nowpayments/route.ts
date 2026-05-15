import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";
import { sendDepositConfirmedEmail, sendOrderKeysEmail, sendOrderDeliveredEmail } from "@/lib/email";
import { deliverOrder } from "@/lib/delivery";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Statuses that count as fully paid for SHOP ORDERS.
// "partially_paid" is intentionally excluded — we never deliver keys for partial payment.
const SHOP_ORDER_CONFIRMED = new Set(["finished", "confirmed"]);

// Deposits credit the STATED amount at intent time, so partially_paid is
// acceptable — we never trust the webhook's paid amount anyway.
const DEPOSIT_CONFIRMED = new Set(["finished", "confirmed", "partially_paid"]);

// ── Signature verification ────────────────────────────────────────────────────

function sortObjectKeys(obj: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return false;
  }
  const expected = createHmac("sha512", secret)
    .update(sortObjectKeys(payload))
    .digest("hex");
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    // Not configured — accept silently so NOWPayments doesn't flood retries
    return NextResponse.json({ ok: true });
  }

  const rawBody = await request.text();
  const sigHeader = request.headers.get("x-nowpayments-sig") ?? "";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify HMAC-SHA512 signature — reject anything that doesn't match
  if (!verifySignature(rawBody, sigHeader, ipnSecret)) {
    logger.warn("NOWPayments IPN signature mismatch", { route: "webhook/nowpayments" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const paymentStatus = String(payload.payment_status ?? "");
  const nowpaymentsId = String(payload.payment_id ?? "");

  if (!nowpaymentsId) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Route: shop order (new system) vs deposit (existing system) ──────────────
  // Determine ownership before applying status rules, since each has different
  // confirmed-status requirements.

  const { data: shopOrder } = await admin
    .from("shop_orders")
    .select("id, user_id, email, status, total_usd")
    .eq("nowpayments_payment_id", nowpaymentsId)
    .maybeSingle();

  if (shopOrder) {
    // Shop orders: only fully confirmed payments — partial payment never fulfills keys
    if (!SHOP_ORDER_CONFIRMED.has(paymentStatus)) {
      logger.info("NOWPayments IPN: shop order status not actionable", {
        nowpaymentsId, paymentStatus,
      });
      return NextResponse.json({ ok: true });
    }
    return handleShopOrder(shopOrder, nowpaymentsId, admin, logger);
  }

  // Deposit handler: partially_paid is acceptable (we credit the stated amount)
  if (!DEPOSIT_CONFIRMED.has(paymentStatus)) {
    return NextResponse.json({ ok: true });
  }

  const txHash = String(payload.outcome_amount ?? payload.payment_id ?? "");
  const actuallyPaidUsd =
    typeof payload.actually_paid_amount_usd === "number"
      ? payload.actually_paid_amount_usd
      : null;

  return handleDeposit(nowpaymentsId, txHash, actuallyPaidUsd, admin, logger);
}

// ── Shop order fulfillment ────────────────────────────────────────────────────

async function handleShopOrder(
  order: { id: string; user_id: string | null; email: string; status: string; total_usd: number },
  nowpaymentsId: string,
  admin: ReturnType<typeof createAdminClient>,
  log: typeof logger
) {
  // Idempotency — if already paid/delivered, ignore
  if (order.status !== "pending") {
    log.info("Shop order already processed — skipping IPN", {
      orderId: order.id,
      status: order.status,
    });
    return NextResponse.json({ ok: true });
  }

  // Atomic transition: pending → paid.
  // .select("id") returns the rows actually updated; an empty result means another
  // concurrent webhook invocation already claimed this order — bail out immediately.
  const { data: lockData, error: updateErr } = await admin
    .from("shop_orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");

  if (updateErr) {
    log.error("Failed to mark shop order paid", {
      orderId: order.id,
      err: String(updateErr),
    });
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  if (!lockData || lockData.length === 0) {
    log.info("Shop order lock not acquired — already being processed", { orderId: order.id });
    return NextResponse.json({ ok: true });
  }

  log.info("Shop order marked paid", { orderId: order.id, email: order.email });

  // ── Fetch order items for delivery ──────────────────────────────────────────
  const { data: items } = await admin
    .from("shop_order_items")
    .select("id, variant_id, variant_name, product_name, quantity")
    .eq("order_id", order.id);

  if (!items || items.length === 0) {
    log.error("No order items found for paid order", { orderId: order.id });
    await admin
      .from("shop_orders")
      .update({ status: "failed", delivery_error: "No order items found", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    return NextResponse.json({ ok: true });
  }

  // ── Mark as delivering ───────────────────────────────────────────────────────
  await admin
    .from("shop_orders")
    .update({ status: "delivering", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  // ── Trigger delivery for each line item via reselling.pro ────────────────────
  const deliveryErrors: string[] = [];
  const deliveredKeys: { itemName: string; keys: string[]; instructions: string; loaderUrl: string }[] = [];

  for (const item of items) {
    // Fetch the variant's reselling.pro product identifier
    const { data: variant } = await admin
      .from("shop_variants")
      .select("reselling_product_id, sellauth_id")
      .eq("id", item.variant_id)
      .single();

    // Fetch product instructions + loader URL
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
      const msg = `No reselling product ID for variant ${item.variant_id} ("${item.variant_name}")`;
      log.error(msg, { orderId: order.id });
      deliveryErrors.push(msg);
      continue;
    }

    const itemKeys: string[] = [];

    // Deliver once per unit purchased
    for (let unit = 0; unit < item.quantity; unit++) {
      const result = await deliverOrder(resellingProductId, order.email);

      if (!result.success) {
        const msg = `Delivery failed for "${item.variant_name}" (unit ${unit + 1}): ${result.message}`;
        log.error(msg, { orderId: order.id });
        deliveryErrors.push(msg);
      } else {
        const keyToStore = result.key ?? result.deliveryId ?? "delivered";
        itemKeys.push(keyToStore);
        // Store delivered key/ID against the item — non-fatal if it fails
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
        itemName: `${item.product_name} — ${item.variant_name}`,
        keys:     itemKeys,
        instructions,
        loaderUrl,
      });
    }
  }

  // ── Final status ─────────────────────────────────────────────────────────────
  const finalStatus = deliveryErrors.length === 0 ? "delivered" : "failed";
  await admin
    .from("shop_orders")
    .update({
      status:         finalStatus,
      delivery_error: deliveryErrors.length > 0 ? deliveryErrors.join(" | ") : null,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", order.id);

  // ── Send delivery email with keys ─────────────────────────────────────────────
  if (order.email) {
    if (finalStatus === "delivered" && deliveredKeys.length > 0) {
      sendOrderKeysEmail(order.email, order.id, deliveredKeys).catch((e) =>
        log.error("Failed to send keys email", { orderId: order.id, err: String(e) })
      );
    } else {
      sendOrderDeliveredEmail(order.email, order.id).catch(() => {});
    }
  }

  log.info(`Shop order ${finalStatus}`, {
    orderId:     order.id,
    email:       order.email,
    errorCount:  deliveryErrors.length,
  });

  return NextResponse.json({ ok: true });
}

// ── Deposit handler (unchanged from original) ─────────────────────────────────

async function handleDeposit(
  nowpaymentsId: string,
  txHash: string,
  actuallyPaidUsd: number | null,
  admin: ReturnType<typeof createAdminClient>,
  log: typeof logger
) {
  const { data: deposit, error: fetchErr } = await admin
    .from("deposits")
    .select("id, user_id, usd_amount, status")
    .eq("nowpayments_id", nowpaymentsId)
    .single();

  if (fetchErr || !deposit) {
    log.warn("Deposit not found for payment_id", { route: "webhook/nowpayments", nowpaymentsId });
    return NextResponse.json({ ok: true });
  }

  if (deposit.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  // Credit the amount recorded at intent time — never trust webhook amount
  const creditAmount = deposit.usd_amount;

  const { error: rpcErr } = await admin.rpc("credit_user_balance", {
    p_user_id: deposit.user_id,
    p_amount:  creditAmount,
  });

  if (rpcErr) {
    log.error("credit_user_balance RPC error", {
      route: "webhook/nowpayments",
      nowpaymentsId,
      err:   String(rpcErr),
    });
    return NextResponse.json({ error: "Balance update failed" }, { status: 500 });
  }

  await admin
    .from("deposits")
    .update({
      status:  "confirmed",
      tx_hash: txHash,
      ...(actuallyPaidUsd !== null ? { usd_amount: actuallyPaidUsd } : {}),
    })
    .eq("id", deposit.id);

  log.info("Deposit confirmed", {
    route:        "webhook/nowpayments",
    userId:       deposit.user_id,
    creditAmount,
  });

  try {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(deposit.user_id);
    if (authUser?.email) {
      sendDepositConfirmedEmail(authUser.email, creditAmount).catch((err) =>
        log.error("Failed to send deposit email", {
          route: "webhook/nowpayments",
          err:   String(err),
        })
      );
    }
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ ok: true });
}
