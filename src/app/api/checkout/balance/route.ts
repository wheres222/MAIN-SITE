import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSellAuthCheckout, getStorefrontData, SellAuthRequestError } from "@/lib/sellauth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: { items?: Array<{ productId: number; quantity: number; variantId?: number }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
  }

  const sanitizedItems = body.items
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity || 1),
      ...(item.variantId ? { variantId: Number(item.variantId) } : {}),
    }))
    .filter((item) => item.productId > 0 && item.quantity > 0);

  if (sanitizedItems.length === 0) {
    return NextResponse.json({ success: false, message: "No valid cart items" }, { status: 400 });
  }

  // 3. Look up prices from SellAuth to compute total
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

  // 4. Atomically deduct balance via RPC (prevents overspend with row-level lock)
  const admin = createAdminClient();
  const { data: rpcResult, error: rpcErr } = await admin.rpc("spend_user_balance", {
    p_user_id: user.id,
    p_amount: totalDollars,
  });

  if (rpcErr || !rpcResult) {
    const msg = rpcErr?.message?.includes("Insufficient") ? "Insufficient balance" : "Balance deduction failed";
    return NextResponse.json({ success: false, message: msg }, { status: 422 });
  }

  // 5. Create SellAuth checkout with the auto-confirm balance payment method
  const paymentMethodId = process.env.SELLAUTH_BALANCE_PAYMENT_METHOD_ID;
  if (!paymentMethodId) {
    // Refund balance since we can't complete the order
    try { await admin.rpc("credit_user_balance", { p_user_id: user.id, p_amount: totalDollars }); } catch {}
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
    try { await admin.rpc("credit_user_balance", { p_user_id: user.id, p_amount: totalDollars }); } catch {}

    if (err instanceof SellAuthRequestError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: "Checkout failed" }, { status: 500 });
  }
}
