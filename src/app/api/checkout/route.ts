import { NextResponse } from "next/server";
import { createSellAuthCheckout, isSellAuthConfigured, SellAuthRequestError } from "@/lib/sellauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNowPayment, CURRENCY_MAP, ALLOWED_CURRENCIES } from "@/lib/nowpayments";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { createHash } from "crypto";
import type { CheckoutRequestInput } from "@/types/sellauth";

export const dynamic = "force-dynamic";

// ── Constants ──────────────────────────────────────────────────────────────────
const CHECKOUT_DEDUPE_WINDOW_MS    = 45_000;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHECKOUT_RATE_LIMIT_MAX       = 6;
const CHECKOUT_ENABLED = process.env.CHECKOUT_FORCE_DISABLE !== "true";
const MIN_ORDER_USD    = 0.50;
const MAX_ORDER_USD    = 2_000;

// ── In-memory stores (per instance) ───────────────────────────────────────────
type LockState  = { status: "pending" | "ready"; updatedAt: number; redirectUrl: string | null; raw?: unknown };
type RateState  = { count: number; updatedAt: number };

function lockStore(): Map<string, LockState> {
  const g = globalThis as typeof globalThis & { __checkoutDedupeStore?: Map<string, LockState> };
  if (!g.__checkoutDedupeStore) g.__checkoutDedupeStore = new Map();
  return g.__checkoutDedupeStore;
}
function rateStore(): Map<string, RateState> {
  const g = globalThis as typeof globalThis & { __checkoutRateStore?: Map<string, RateState> };
  if (!g.__checkoutRateStore) g.__checkoutRateStore = new Map();
  return g.__checkoutRateStore;
}

function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
}
function cleanupLocks(store: Map<string, LockState>, now: number) {
  for (const [k, v] of store.entries()) {
    if (now - v.updatedAt > CHECKOUT_DEDUPE_WINDOW_MS * 2) store.delete(k);
  }
}
function cleanupRates(store: Map<string, RateState>, now: number) {
  for (const [k, v] of store.entries()) {
    if (now - v.updatedAt > CHECKOUT_RATE_LIMIT_WINDOW_MS * 2) store.delete(k);
  }
}
function isRateLimited(store: Map<string, RateState>, key: string, now: number): boolean {
  const e = store.get(key);
  if (!e || now - e.updatedAt > CHECKOUT_RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, updatedAt: now });
    return false;
  }
  e.count++;
  e.updatedAt = now;
  store.set(key, e);
  return e.count > CHECKOUT_RATE_LIMIT_MAX;
}

async function sha256hex(input: string): Promise<string> {
  const bytes  = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

// ── Extended request shape (adds email + currency for crypto path) ─────────────
interface ExtendedCheckoutInput extends Partial<CheckoutRequestInput> {
  email?:    string;
  currency?: string; // "btc" | "eth" | "sol" etc.
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!CHECKOUT_ENABLED) {
    return NextResponse.json(
      { success: false, message: "Checkout is currently paused by security policy." },
      { status: 503 }
    );
  }

  let dedupeKey = "";
  const locks  = lockStore();
  const rates  = rateStore();

  try {
    const body = (await request.json()) as ExtendedCheckoutInput;

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!body.paymentMethod && !body.currency) {
      return invalid("paymentMethod or currency is required.");
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return invalid("At least one cart item is required.");
    }

    const sanitizedItems = body.items
      .map((item) => ({
        productId: Number(item.productId),
        quantity:  Number(item.quantity || 1),
        ...(item.variantId ? { variantId: Number(item.variantId) } : {}),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.productId) && item.productId > 0 &&
          Number.isFinite(item.quantity)  && item.quantity  > 0
      );

    if (sanitizedItems.length === 0) return invalid("Cart items are invalid.");

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const now     = Date.now();
    const rateKey = await sha256hex(`${clientIp(request)}|${(request.headers.get("user-agent") || "").slice(0, 120)}`);
    cleanupLocks(locks, now);
    cleanupRates(rates, now);
    if (isRateLimited(rates, rateKey, now)) {
      return NextResponse.json(
        { success: false, message: "Too many checkout attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    // ── Dedupe key ────────────────────────────────────────────────────────────
    const idempotencyKey = (request.headers.get("x-idempotency-key") || "").trim();
    const dedupeSource   = JSON.stringify({
      idempotencyKey,
      ip:    clientIp(request),
      ua:    (request.headers.get("user-agent") || "").slice(0, 180),
      items: sanitizedItems.map((i) => ({ p: i.productId, v: i.variantId || 0, q: i.quantity }))
        .sort((a, b) => a.p - b.p || a.v - b.v),
    });
    dedupeKey = await sha256hex(dedupeSource);

    const existing = locks.get(dedupeKey);
    if (existing && now - existing.updatedAt < CHECKOUT_DEDUPE_WINDOW_MS) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { success: false, message: "Checkout request already in progress. Please wait a few seconds.", deduped: true },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: true, message: "Reusing recent checkout session.", redirectUrl: existing.redirectUrl, data: existing.raw, deduped: true });
    }

    locks.set(dedupeKey, { status: "pending", updatedAt: now, redirectUrl: null });

    // ── Route: SellAuth (when configured) ─────────────────────────────────────
    if (isSellAuthConfigured()) {
      const checkout = await createSellAuthCheckout({
        email:         body.email,
        paymentMethod: body.paymentMethod!,
        couponCode:    body.couponCode,
        items:         sanitizedItems,
      });
      locks.set(dedupeKey, { status: "ready", updatedAt: Date.now(), redirectUrl: checkout.redirectUrl, raw: checkout.raw });
      return NextResponse.json({ success: true, message: checkout.redirectUrl ? "Checkout created successfully." : "Checkout created.", redirectUrl: checkout.redirectUrl, data: checkout.raw });
    }

    // ── Route: Stripe (card payment) ──────────────────────────────────────────
    const requestedCurrency = (body.currency || body.paymentMethod || "").toLowerCase();
    if (requestedCurrency === "stripe" || requestedCurrency === "card") {
      return await handleStripeCheckout(body, sanitizedItems, dedupeKey, locks);
    }

    // ── Route: Supabase + NOWPayments (crypto) ────────────────────────────────
    return await handleCryptoCheckout(body, sanitizedItems, dedupeKey, locks, idempotencyKey);

  } catch (error) {
    if (dedupeKey) locks.delete(dedupeKey);
    if (error instanceof SellAuthRequestError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unable to create checkout.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ── Stripe (card) checkout ────────────────────────────────────────────────────
async function handleStripeCheckout(
  body: ExtendedCheckoutInput,
  sanitizedItems: { productId: number; quantity: number; variantId?: number }[],
  dedupeKey: string,
  locks: Map<string, LockState>,
): Promise<NextResponse> {

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    locks.delete(dedupeKey);
    return NextResponse.json({ success: false, message: "A valid email address is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency
  const idempHash = createHash("sha256").update(`stripe:${dedupeKey}:${email}`).digest("hex");
  const { data: existingOrder } = await admin
    .from("shop_orders")
    .select("id, stripe_session_url")
    .eq("idempotency_key", idempHash)
    .maybeSingle();

  if (existingOrder?.stripe_session_url) {
    locks.set(dedupeKey, { status: "ready", updatedAt: Date.now(), redirectUrl: existingOrder.stripe_session_url });
    return NextResponse.json({ success: true, message: "Resuming existing Stripe session.", redirectUrl: existingOrder.stripe_session_url });
  }

  // Resolve numeric IDs → Supabase UUIDs (same logic as crypto path)
  type StripeLineItem = { variantId: string; productId: string; productName: string; variantName: string; quantity: number; unitPrice: number };
  const lineItems: StripeLineItem[] = [];
  let totalUsd = 0;

  for (const item of sanitizedItems) {
    let variantRow: { id: string; product_id: string; name: string; price: number; stock_available: boolean; active: boolean } | null = null;

    if (item.variantId) {
      const { data } = await admin
        .from("shop_variants")
        .select("id, product_id, name, price, stock_available, active")
        .eq("sellauth_id", String(item.variantId))
        .maybeSingle();
      variantRow = data ?? null;
    }
    if (!variantRow) {
      const { data: prod } = await admin.from("shop_products").select("id").eq("sellauth_id", String(item.productId)).maybeSingle();
      if (prod) {
        const { data } = await admin.from("shop_variants").select("id, product_id, name, price, stock_available, active").eq("product_id", prod.id).eq("active", true).order("sort_order").limit(1).maybeSingle();
        variantRow = data ?? null;
      }
    }

    if (!variantRow || !variantRow.active) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: `Product not found or unavailable.` }, { status: 404 }); }
    if (!variantRow.stock_available)        { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: `"${variantRow.name}" is out of stock.` }, { status: 400 }); }

    const { data: productRow } = await admin.from("shop_products").select("id, name, active").eq("id", variantRow.product_id).maybeSingle();
    if (!productRow?.active) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: "Product unavailable." }, { status: 400 }); }

    const unitPrice = Number(variantRow.price);
    totalUsd += Math.round(unitPrice * item.quantity * 100) / 100;
    lineItems.push({ variantId: variantRow.id, productId: variantRow.product_id, productName: productRow.name as string, variantName: variantRow.name, quantity: item.quantity, unitPrice });
  }

  totalUsd = Math.round(totalUsd * 100) / 100;
  if (totalUsd < 0.50) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: "Minimum order is $0.50." }, { status: 400 }); }

  // Create pending order
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .insert({ user_id: null, email, status: "pending", total_usd: totalUsd, pay_currency: "stripe", idempotency_key: idempHash })
    .select("id").single();

  if (orderErr || !order) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: "Failed to create order." }, { status: 500 }); }

  const { error: itemsErr } = await admin.from("shop_order_items").insert(
    lineItems.map((li) => ({ order_id: order.id, product_id: li.productId, variant_id: li.variantId, product_name: li.productName, variant_name: li.variantName, quantity: li.quantity, unit_price_usd: li.unitPrice }))
  );
  if (itemsErr) {
    await admin.from("shop_orders").delete().eq("id", order.id);
    locks.delete(dedupeKey);
    return NextResponse.json({ success: false, message: "Failed to save order items." }, { status: 500 });
  }

  // Create Stripe session
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  let session: { sessionId: string; url: string };
  try {
    session = await createStripeCheckoutSession({
      orderId:       order.id,
      customerEmail: email,
      lineItems:     lineItems.map((li) => ({ productName: li.productName, variantName: li.variantName, quantity: li.quantity, unitPriceUsd: li.unitPrice })),
      successUrl:    `${origin}/checkout/${order.id}?stripe=success`,
      cancelUrl:     `${origin}/checkout/${order.id}?stripe=cancelled`,
    });
  } catch (e) {
    await admin.from("shop_order_items").delete().eq("order_id", order.id);
    await admin.from("shop_orders").delete().eq("id", order.id);
    locks.delete(dedupeKey);
    console.error("[checkout/stripe-bridge] Stripe error", e);
    return NextResponse.json({ success: false, message: "Card payment unavailable. Please try again or use crypto." }, { status: 502 });
  }

  await admin.from("shop_orders").update({ stripe_session_id: session.sessionId, stripe_session_url: session.url, updated_at: new Date().toISOString() }).eq("id", order.id);

  locks.set(dedupeKey, { status: "ready", updatedAt: Date.now(), redirectUrl: session.url });
  return NextResponse.json({ success: true, message: "Stripe session created.", redirectUrl: session.url });
}

// ── Crypto checkout via Supabase + NOWPayments ─────────────────────────────────
async function handleCryptoCheckout(
  body: ExtendedCheckoutInput,
  sanitizedItems: { productId: number; quantity: number; variantId?: number }[],
  dedupeKey: string,
  locks: Map<string, LockState>,
  idempotencyKey: string,
): Promise<NextResponse> {

  // Validate email
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    locks.delete(dedupeKey);
    return NextResponse.json({ success: false, message: "A valid email address is required for delivery." }, { status: 400 });
  }

  // Validate currency
  const currency = (body.currency || body.paymentMethod || "btc").toLowerCase();
  const payCurrency = CURRENCY_MAP[currency];
  if (!payCurrency) {
    locks.delete(dedupeKey);
    return NextResponse.json({
      success: false,
      message: `Unsupported currency. Choose from: ${ALLOWED_CURRENCIES.join(", ")}`,
    }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Idempotency: return existing order if already created ─────────────────
  const idempHash = createHash("sha256").update(dedupeKey + email).digest("hex");
  const { data: existingOrder } = await admin
    .from("shop_orders")
    .select("id, status")
    .eq("idempotency_key", idempHash)
    .maybeSingle();

  if (existingOrder) {
    const redirectUrl = `/checkout/${existingOrder.id}`;
    locks.set(dedupeKey, { status: "ready", updatedAt: Date.now(), redirectUrl });
    return NextResponse.json({ success: true, message: "Resuming existing order.", redirectUrl });
  }

  // ── Resolve numeric IDs → Supabase UUIDs ──────────────────────────────────
  type LineItem = {
    variantId:   string;
    productId:   string;
    productName: string;
    variantName: string;
    quantity:    number;
    unitPrice:   number;
  };
  const lineItems: LineItem[] = [];
  let totalUsd = 0;

  for (const item of sanitizedItems) {
    // Try to find variant by sellauth_id first, then by product sellauth_id
    let variantRow: { id: string; product_id: string; name: string; price: number; stock_available: boolean; active: boolean } | null = null;

    if (item.variantId) {
      const { data } = await admin
        .from("shop_variants")
        .select("id, product_id, name, price, stock_available, active")
        .eq("sellauth_id", String(item.variantId))
        .maybeSingle();
      variantRow = data ?? null;
    }

    // Fallback: look up by product sellauth_id and take first active variant
    if (!variantRow) {
      const { data: prod } = await admin
        .from("shop_products")
        .select("id")
        .eq("sellauth_id", String(item.productId))
        .maybeSingle();

      if (prod) {
        const { data } = await admin
          .from("shop_variants")
          .select("id, product_id, name, price, stock_available, active")
          .eq("product_id", prod.id)
          .eq("active", true)
          .order("sort_order")
          .limit(1)
          .maybeSingle();
        variantRow = data ?? null;
      }
    }

    if (!variantRow) {
      locks.delete(dedupeKey);
      return NextResponse.json({
        success: false,
        message: `Product #${item.variantId || item.productId} not found. Please contact support if this persists.`,
      }, { status: 404 });
    }

    if (!variantRow.active) {
      locks.delete(dedupeKey);
      return NextResponse.json({ success: false, message: `"${variantRow.name}" is not currently available.` }, { status: 400 });
    }
    if (!variantRow.stock_available) {
      locks.delete(dedupeKey);
      return NextResponse.json({ success: false, message: `"${variantRow.name}" is out of stock.` }, { status: 400 });
    }

    // Fetch product name
    const { data: productRow } = await admin
      .from("shop_products")
      .select("id, name, active")
      .eq("id", variantRow.product_id)
      .maybeSingle();

    if (!productRow?.active) {
      locks.delete(dedupeKey);
      return NextResponse.json({ success: false, message: `This product is currently unavailable.` }, { status: 400 });
    }

    const unitPrice = Number(variantRow.price);
    const lineTotal  = Math.round(unitPrice * item.quantity * 100) / 100;
    totalUsd        += lineTotal;

    lineItems.push({
      variantId:   variantRow.id,
      productId:   variantRow.product_id,
      productName: productRow.name as string,
      variantName: variantRow.name,
      quantity:    item.quantity,
      unitPrice,
    });
  }

  totalUsd = Math.round(totalUsd * 100) / 100;
  if (totalUsd < MIN_ORDER_USD) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: `Minimum order is $${MIN_ORDER_USD.toFixed(2)}.` }, { status: 400 }); }
  if (totalUsd > MAX_ORDER_USD) { locks.delete(dedupeKey); return NextResponse.json({ success: false, message: `Maximum order is $${MAX_ORDER_USD.toFixed(2)}.` }, { status: 400 }); }

  // ── Create pending order ───────────────────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .insert({
      user_id:         null,
      email,
      status:          "pending",
      total_usd:       totalUsd,
      pay_currency:    payCurrency,
      idempotency_key: idempHash,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    locks.delete(dedupeKey);
    console.error("[checkout] order insert error", orderErr);
    return NextResponse.json({ success: false, message: "Failed to create order. Please try again." }, { status: 500 });
  }

  // ── Insert order items ─────────────────────────────────────────────────────
  const { error: itemsErr } = await admin.from("shop_order_items").insert(
    lineItems.map((li) => ({
      order_id:        order.id,
      product_id:      li.productId,
      variant_id:      li.variantId,
      product_name:    li.productName,
      variant_name:    li.variantName,
      quantity:        li.quantity,
      unit_price_usd:  li.unitPrice,
    }))
  );

  if (itemsErr) {
    await admin.from("shop_orders").delete().eq("id", order.id);
    locks.delete(dedupeKey);
    console.error("[checkout] order items insert error", itemsErr);
    return NextResponse.json({ success: false, message: "Failed to save order items. Please try again." }, { status: 500 });
  }

  // ── Create NOWPayments invoice ─────────────────────────────────────────────
  let nowPayment;
  try {
    nowPayment = await createNowPayment({
      usdAmount:        totalUsd,
      payCurrency,
      orderId:          order.id,
      ipnCallbackUrl:   `${siteOrigin()}/api/webhooks/nowpayments`,
      orderDescription: lineItems.map((li) => `${li.productName} x${li.quantity}`).join(", "),
    });
  } catch (e) {
    await admin.from("shop_order_items").delete().eq("order_id", order.id);
    await admin.from("shop_orders").delete().eq("id", order.id);
    locks.delete(dedupeKey);
    console.error("[checkout] NOWPayments error", e);
    return NextResponse.json({ success: false, message: "Payment provider unavailable. Please try again shortly." }, { status: 502 });
  }

  // ── Persist payment details ────────────────────────────────────────────────
  await admin
    .from("shop_orders")
    .update({
      nowpayments_payment_id: nowPayment.payment_id,
      pay_address:            nowPayment.pay_address,
      pay_amount:             nowPayment.pay_amount,
      updated_at:             new Date().toISOString(),
    })
    .eq("id", order.id);

  const redirectUrl = `/checkout/${order.id}`;
  locks.set(dedupeKey, { status: "ready", updatedAt: Date.now(), redirectUrl });

  return NextResponse.json({ success: true, message: "Order created successfully.", redirectUrl });
}
