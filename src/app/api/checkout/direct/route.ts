import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNowPayment, CURRENCY_MAP, ALLOWED_CURRENCIES } from "@/lib/nowpayments";
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ITEMS_PER_ORDER = 20;
const MAX_QTY_PER_ITEM   = 5;
const MIN_ORDER_USD       = 0.50;
const MAX_ORDER_USD       = 2_000;

// ── Rate limiting (in-memory per instance; good enough paired with idempotency) ─

interface RateEntry { count: number; resetAt: number }
const RATE_WINDOW_MS  = 60_000;
const RATE_MAX        = 5;
const rateMap         = new Map<string, RateEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

// ── Request body shape ────────────────────────────────────────────────────────

interface CartItem {
  variantId: string;
  quantity:  number;
}

interface CheckoutBody {
  items:           CartItem[];
  currency:        string;   // short ticker, e.g. "btc"
  email:           string;
  idempotencyKey:  string;   // client-generated UUID; we use as uniqueness guard
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 0. Rate limit ───────────────────────────────────────────────────────────
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return bad("Too many checkout attempts. Please wait a minute.", 429);
  }

  // ── 1. Optional auth (guests allowed; we capture email for delivery) ─────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── 2. Parse body ───────────────────────────────────────────────────────────
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return bad("Invalid request body");
  }

  const { items, currency, email, idempotencyKey } = body;

  // ── 3. Validate inputs ──────────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return bad("Cart is empty");
  }
  if (items.length > MAX_ITEMS_PER_ORDER) {
    return bad(`Maximum ${MAX_ITEMS_PER_ORDER} items per order`);
  }
  if (typeof currency !== "string" || !ALLOWED_CURRENCIES.includes(currency)) {
    return bad("Unsupported currency");
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("Valid email address required");
  }
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return bad("Invalid idempotency key");
  }

  // Sanitise + validate item structure before hitting DB
  const sanitized: { variantId: string; quantity: number }[] = [];
  for (const item of items) {
    if (typeof item.variantId !== "string" || !item.variantId) return bad("Invalid variantId");
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return bad(`Quantity must be 1–${MAX_QTY_PER_ITEM}`);
    }
    sanitized.push({ variantId: item.variantId, quantity: qty });
  }

  const admin = createAdminClient();

  // ── 4. Idempotency — return existing order if already created ───────────────
  // Hash the key so raw client UUIDs are never used as DB primary lookup strings
  const idempotencyHash = createHash("sha256").update(idempotencyKey).digest("hex");

  const { data: existingOrder } = await admin
    .from("shop_orders")
    .select("id, status, nowpayments_payment_id, pay_address, pay_amount, pay_currency, total_usd")
    .eq("idempotency_key", idempotencyHash)
    .maybeSingle();

  if (existingOrder) {
    // Already created — return same payment details (safe to retry)
    return NextResponse.json({
      orderId:     existingOrder.id,
      paymentId:   existingOrder.nowpayments_payment_id,
      payAddress:  existingOrder.pay_address,
      payAmount:   existingOrder.pay_amount,
      payCurrency: existingOrder.pay_currency,
      totalUsd:    existingOrder.total_usd,
      status:      existingOrder.status,
      reused:      true,
    });
  }

  // ── 5. Fetch variants from OWN DB — never trust client-supplied prices ───────
  const variantIds = [...new Set(sanitized.map((i) => i.variantId))];

  const { data: variants, error: varErr } = await admin
    .from("shop_variants")
    .select("id, product_id, name, price, stock_available, is_active:active")
    .in("id", variantIds);

  if (varErr || !variants || variants.length === 0) {
    return bad("One or more products not found", 404);
  }

  // Build lookup map
  const variantMap = new Map(variants.map((v) => [v.id as string, v]));

  // ── 6. Validate all variants are active + in stock ──────────────────────────
  for (const v of variants) {
    if (!v.is_active) return bad(`"${v.name}" is not currently available`);
    if (v.stock_available === false) return bad(`"${v.name}" is out of stock`);
  }

  // ── 7. Fetch parent products (to confirm they're active) ────────────────────
  const productIds = [...new Set(variants.map((v) => v.product_id as string))];
  const { data: products, error: prodErr } = await admin
    .from("shop_products")
    .select("id, name, is_active:active")
    .in("id", productIds);

  if (prodErr || !products) {
    return bad("Failed to load product data", 500);
  }

  const productMap = new Map(products.map((p) => [p.id as string, p]));
  for (const p of products) {
    if (!p.is_active) return bad(`"${p.name}" is currently unavailable`);
  }

  // ── 8. Calculate total ──────────────────────────────────────────────────────
  let totalUsd = 0;
  const lineItems: {
    variantId:   string;
    productId:   string;
    productName: string;
    variantName: string;
    quantity:    number;
    unitPrice:   number;
    lineTotal:   number;
  }[] = [];

  for (const { variantId, quantity } of sanitized) {
    const v = variantMap.get(variantId);
    if (!v) return bad(`Variant ${variantId} not found`, 404);
    const p = productMap.get(v.product_id as string);
    if (!p) return bad(`Product for variant ${variantId} not found`, 404);

    const unitPrice = Number(v.price);
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    totalUsd += lineTotal;

    lineItems.push({
      variantId,
      productId:   v.product_id as string,
      productName: p.name as string,
      variantName: v.name as string,
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  totalUsd = Math.round(totalUsd * 100) / 100;

  if (totalUsd < MIN_ORDER_USD) return bad(`Minimum order is $${MIN_ORDER_USD.toFixed(2)}`);
  if (totalUsd > MAX_ORDER_USD) return bad(`Maximum order is $${MAX_ORDER_USD.toFixed(2)}`);

  // ── 9. Create pending order row ─────────────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .insert({
      user_id:         user?.id ?? null,
      email:           email.toLowerCase().trim(),
      status:          "pending",
      total_usd:       totalUsd,
      pay_currency:    CURRENCY_MAP[currency],
      idempotency_key: idempotencyHash,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[checkout/direct] order insert error", orderErr);
    return bad("Failed to create order. Please try again.", 500);
  }

  // ── 10. Insert order items ──────────────────────────────────────────────────
  const { error: itemsErr } = await admin.from("shop_order_items").insert(
    lineItems.map((li) => ({
      order_id:     order.id,
      product_id:   li.productId,
      variant_id:   li.variantId,
      product_name: li.productName,
      variant_name: li.variantName,
      quantity:     li.quantity,
      unit_price_usd: li.unitPrice,
    }))
  );

  if (itemsErr) {
    // Clean up orphaned order
    await admin.from("shop_orders").delete().eq("id", order.id);
    console.error("[checkout/direct] order items insert error", itemsErr);
    return bad("Failed to create order items. Please try again.", 500);
  }

  // ── 11. Create NOWPayments invoice ──────────────────────────────────────────
  let nowPayment;
  try {
    nowPayment = await createNowPayment({
      usdAmount:       totalUsd,
      payCurrency:     CURRENCY_MAP[currency],
      orderId:         order.id,
      ipnCallbackUrl:  `${siteOrigin()}/api/webhooks/nowpayments`,
      orderDescription: lineItems.map((li) => `${li.productName} x${li.quantity}`).join(", "),
    });
  } catch (e) {
    // Roll back the pending order so they can retry cleanly
    await admin.from("shop_order_items").delete().eq("order_id", order.id);
    await admin.from("shop_orders").delete().eq("id", order.id);
    console.error("[checkout/direct] NOWPayments error", e);
    return bad("Payment provider unavailable. Please try again shortly.", 502);
  }

  // ── 12. Persist payment details ─────────────────────────────────────────────
  await admin
    .from("shop_orders")
    .update({
      nowpayments_payment_id: nowPayment.payment_id,
      pay_address:            nowPayment.pay_address,
      pay_amount:             nowPayment.pay_amount,
      updated_at:             new Date().toISOString(),
    })
    .eq("id", order.id);

  // ── 13. Return payment details to client ────────────────────────────────────
  return NextResponse.json({
    orderId:     order.id,
    paymentId:   nowPayment.payment_id,
    payAddress:  nowPayment.pay_address,
    payAmount:   nowPayment.pay_amount,
    payCurrency: nowPayment.pay_currency,
    expiresAt:   nowPayment.expiration_estimate_date,
    totalUsd,
  });
}
