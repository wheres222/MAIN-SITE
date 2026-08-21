import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSellAuthCheckout, getStorefrontData, SellAuthRequestError } from "@/lib/sellauth";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Matches the ceilings the card and crypto checkout routes already enforce. */
const MIN_ORDER_USD = 0.5;
const MAX_ORDER_USD = 2000;

/** Nothing in this catalogue is sold by the hundred; this is an abuse guard. */
const MAX_QUANTITY = 25;

/**
 * Return balance taken for an order that then failed to be created.
 *
 * Both call sites previously swallowed the error entirely — `catch {}` — so a
 * failed credit meant the customer had paid and received nothing, with no
 * record anywhere that it had happened. It still must not throw (the caller is
 * already on a failure path and has a response to return), but it has to be
 * loud: this is the one log line that tells you a specific person is owed a
 * specific amount.
 */
async function refundBalance(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  try {
    const { error } = await admin.rpc("credit_user_balance", {
      p_user_id: userId,
      p_amount: amount,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    logger.error(
      "BALANCE NOT REFUNDED — customer is owed this amount and must be credited by hand",
      {
        route: "checkout/balance",
        userId,
        amount,
        reason,
        err: String(err),
      }
    );
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit. This route spends real balance and was the only checkout
  // route with no limit at all.
  const limit = rateLimit("checkout-balance", user.id, { windowMs: 60_000, max: 10 });
  if (limit.limited) {
    return NextResponse.json(
      { success: false, message: "Too many checkout attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // 3. Parse body
  let body: { items?: Array<{ productId: number; quantity: number; variantId?: number }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
  }

  // Integers only, and capped. `Number(x) > 0` alone accepted 0.5 and Infinity,
  // both of which went straight into the total and on to SellAuth.
  const sanitizedItems = body.items
    .map((item) => ({
      productId: Math.trunc(Number(item.productId)),
      quantity: Math.trunc(Number(item.quantity || 1)),
      ...(item.variantId ? { variantId: Math.trunc(Number(item.variantId)) } : {}),
    }))
    .filter(
      (item) =>
        Number.isSafeInteger(item.productId) &&
        item.productId > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= MAX_QUANTITY
    );

  if (sanitizedItems.length === 0) {
    return NextResponse.json({ success: false, message: "No valid cart items" }, { status: 400 });
  }

  // 4. Look up prices from SellAuth to compute total
  let storefront: Awaited<ReturnType<typeof getStorefrontData>>;
  try {
    storefront = await getStorefrontData();
  } catch {
    return NextResponse.json({ success: false, message: "Could not fetch product prices" }, { status: 502 });
  }

  const productMap = new Map(storefront.products.map((p) => [p.id, p]));
  let totalCents = 0;

  for (const item of sanitizedItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ success: false, message: `Product ${item.productId} not found` }, { status: 400 });
    }
    let unitPrice: number | null = null;
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      unitPrice = variant?.price ?? product.price;
    } else {
      unitPrice = product.price;
    }
    if (typeof unitPrice !== "number") {
      return NextResponse.json({ success: false, message: `Price unavailable for product ${item.productId}` }, { status: 400 });
    }
    totalCents += Math.round(unitPrice * 100) * item.quantity;
  }

  const totalDollars = totalCents / 100;

  // The card and crypto routes both bound the order total; this one did not, so
  // it was the way round the ceiling.
  if (totalDollars < MIN_ORDER_USD) {
    return NextResponse.json(
      { success: false, message: `Minimum order is $${MIN_ORDER_USD.toFixed(2)}` },
      { status: 400 }
    );
  }
  if (totalDollars > MAX_ORDER_USD) {
    return NextResponse.json(
      { success: false, message: `Maximum order is $${MAX_ORDER_USD.toFixed(2)}` },
      { status: 400 }
    );
  }

  // 5. Atomically deduct balance via RPC (prevents overspend with row-level lock)
  const admin = createAdminClient();
  const { data: rpcResult, error: rpcErr } = await admin.rpc("spend_user_balance", {
    p_user_id: user.id,
    p_amount: totalDollars,
  });

  if (rpcErr || !rpcResult) {
    const msg = rpcErr?.message?.includes("Insufficient") ? "Insufficient balance" : "Balance deduction failed";
    return NextResponse.json({ success: false, message: msg }, { status: 422 });
  }

  // 6. Create SellAuth checkout with the auto-confirm balance payment method
  const paymentMethodId = process.env.SELLAUTH_BALANCE_PAYMENT_METHOD_ID;
  if (!paymentMethodId) {
    // Refund balance since we can't complete the order
    await refundBalance(admin, user.id, totalDollars, "balance payment method not configured");
    return NextResponse.json({ success: false, message: "Balance checkout not configured" }, { status: 503 });
  }

  try {
    const checkout = await createSellAuthCheckout({
      paymentMethod: paymentMethodId,
      email: user.email,
      items: sanitizedItems,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: checkout.redirectUrl,
      data: checkout.raw,
    });
  } catch (err) {
    await refundBalance(admin, user.id, totalDollars, "SellAuth checkout creation failed");

    if (err instanceof SellAuthRequestError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: "Checkout failed" }, { status: 500 });
  }
}
