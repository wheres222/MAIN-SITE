import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ITEMS_PER_ORDER = 20;
const MAX_QTY_PER_ITEM   = 5;
const MIN_ORDER_USD       = 0.50;
const MAX_ORDER_USD       = 2_000;

// ── Rate limiting ─────────────────────────────────────────────────────────────

interface RateEntry { count: number; resetAt: number }
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 5;
const rateMap        = new Map<string, RateEntry>();

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

// ── Request shape ─────────────────────────────────────────────────────────────

interface CartItem {
  variantId: string;
  quantity:  number;
}

interface CheckoutBody {
  items:          CartItem[];
  email:          string;
  idempotencyKey: string;
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 0. Rate limit ───────────────────────────────────────────────────────────
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return bad("Too many checkout attempts. Please wait a minute.", 429);
  }

  // ── 1. Optional auth ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── 2. Parse + validate body ────────────────────────────────────────────────
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return bad("Invalid request body");
  }

  const { items, email, idempotencyKey } = body;

  if (!Array.isArray(items) || items.length === 0) return bad("Cart is empty");
  if (items.length > MAX_ITEMS_PER_ORDER) return bad(`Maximum ${MAX_ITEMS_PER_ORDER} items per order`);
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("Valid email address required");
  }
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return bad("Invalid idempotency key");
  }

  // Sanitise items
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

  // ── 3. Idempotency ──────────────────────────────────────────────────────────
  const idempotencyHash = createHash("sha256")
    .update(`stripe:${idempotencyKey}`)
    .digest("hex");

  const { data: existingOrder } = await admin
    .from("shop_orders")
    .select("id, status, stripe_session_url")
    .eq("idempotency_key", idempotencyHash)
    .maybeSingle();

  if (existingOrder?.stripe_session_url) {
    return NextResponse.json({
      url:     existingOrder.stripe_session_url,
      orderId: existingOrder.id,
      reused:  true,
    });
  }

  // ── 4. Validate variants against our DB ─────────────────────────────────────
  const variantIds = [...new Set(sanitized.map((i) => i.variantId))];

  const { data: variants, error: varErr } = await admin
    .from("shop_variants")
    .select("id, product_id, name, price, stock_available, is_active:active")
    .in("id", variantIds);

  if (varErr || !variants || variants.length === 0) {
    return bad("One or more products not found", 404);
  }

  const variantMap = new Map(variants.map((v) => [v.id as string, v]));

  for (const v of variants) {
    if (!v.is_active) return bad(`"${v.name}" is not currently available`);
    if (v.stock_available === false) return bad(`"${v.name}" is out of stock`);
  }

  // ── 5. Validate parent products ─────────────────────────────────────────────
  const productIds = [...new Set(variants.map((v) => v.product_id as string))];
  const { data: products, error: prodErr } = await admin
    .from("shop_products")
    .select("id, name, is_active:active")
    .in("id", productIds);

  if (prodErr || !products) return bad("Failed to load product data", 500);
  const productMap = new Map(products.map((p) => [p.id as string, p]));
  for (const p of products) {
    if (!p.is_active) return bad(`"${p.name}" is currently unavailable`);
  }

  // ── 6. Calculate total ──────────────────────────────────────────────────────
  let totalUsd = 0;
  const lineItems: {
    variantId:   string;
    productId:   string;
    productName: string;
    variantName: string;
    quantity:    number;
    unitPrice:   number;
  }[] = [];

  for (const { variantId, quantity } of sanitized) {
    const v = variantMap.get(variantId)!;
    const p = productMap.get(v.product_id as string)!;
    const unitPrice  = Number(v.price);
    totalUsd += Math.round(unitPrice * quantity * 100) / 100;
    lineItems.push({
      variantId,
      productId:   v.product_id as string,
      productName: p.name as string,
      variantName: v.name as string,
      quantity,
      unitPrice,
    });
  }
  totalUsd = Math.round(totalUsd * 100) / 100;

  if (totalUsd < MIN_ORDER_USD) return bad(`Minimum order is $${MIN_ORDER_USD.toFixed(2)}`);
  if (totalUsd > MAX_ORDER_USD) return bad(`Maximum order is $${MAX_ORDER_USD.toFixed(2)}`);

  // ── 7. Create pending order ─────────────────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .insert({
      user_id:         user?.id ?? null,
      email:           email.toLowerCase().trim(),
      status:          "pending",
      total_usd:       totalUsd,
      pay_currency:    "stripe",
      idempotency_key: idempotencyHash,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[checkout/stripe] order insert error", orderErr);
    return bad("Failed to create order. Please try again.", 500);
  }

  // ── 8. Insert order items ───────────────────────────────────────────────────
  const { error: itemsErr } = await admin.from("shop_order_items").insert(
    lineItems.map((li) => ({
      order_id:       order.id,
      product_id:     li.productId,
      variant_id:     li.variantId,
      product_name:   li.productName,
      variant_name:   li.variantName,
      quantity:       li.quantity,
      unit_price_usd: li.unitPrice,
    }))
  );

  if (itemsErr) {
    await admin.from("shop_orders").delete().eq("id", order.id);
    console.error("[checkout/stripe] order items insert error", itemsErr);
    return bad("Failed to create order items. Please try again.", 500);
  }

  // ── 9. Create Stripe Checkout Session ───────────────────────────────────────
  const origin = siteOrigin();
  let session;
  try {
    session = await createStripeCheckoutSession({
      orderId:       order.id,
      customerEmail: email,
      lineItems:     lineItems.map((li) => ({
        productName:  li.productName,
        variantName:  li.variantName,
        quantity:     li.quantity,
        unitPriceUsd: li.unitPrice,
      })),
      successUrl: `${origin}/order/confirm/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${origin}/order/confirm/${order.id}?cancelled=1`,
    });
  } catch (e) {
    await admin.from("shop_order_items").delete().eq("order_id", order.id);
    await admin.from("shop_orders").delete().eq("id", order.id);
    console.error("[checkout/stripe] Stripe session error", e);
    return bad("Payment provider unavailable. Please try again shortly.", 502);
  }

  // ── 10. Persist Stripe session ID + URL ─────────────────────────────────────
  await admin
    .from("shop_orders")
    .update({
      stripe_session_id:  session.sessionId,
      stripe_session_url: session.url,
      updated_at:         new Date().toISOString(),
    })
    .eq("id", order.id);

  // ── 11. Return Stripe URL for redirect ──────────────────────────────────────
  return NextResponse.json({
    url:     session.url,
    orderId: order.id,
  });
}
