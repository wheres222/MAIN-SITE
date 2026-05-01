import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/order/shop/[orderId]
 *
 * Returns a shop order and its line items.
 * Only accessible to:
 *   - The authenticated user who placed the order (user_id match)
 *   - Admin (ADMIN_EMAIL env var match)
 *
 * Guests (no user_id on the order) can't retrieve via this endpoint —
 * they receive their keys by email at delivery time.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch the order
  const { data: order, error: orderErr } = await admin
    .from("shop_orders")
    .select("id, user_id, email, status, total_usd, pay_currency, pay_address, pay_amount, nowpayments_payment_id, created_at, updated_at, delivery_error")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Access control — must own the order or be admin
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = adminEmail && user.email?.toLowerCase() === adminEmail;
  const isOwner = order.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch line items — only include delivery_keys if delivered
  const { data: items } = await admin
    .from("shop_order_items")
    .select("id, product_name, variant_name, quantity, unit_price_usd, delivery_keys, delivered_at")
    .eq("order_id", orderId);

  // Strip delivery_keys from pending/failed orders for cleanliness
  const sanitizedItems = (items ?? []).map((item) => ({
    ...item,
    // Only expose keys once the order is delivered
    delivery_keys: order.status === "delivered" ? (item.delivery_keys ?? []) : [],
  }));

  return NextResponse.json({
    order: {
      id:                    order.id,
      status:                order.status,
      email:                 order.email,
      totalUsd:              order.total_usd,
      payCurrency:           order.pay_currency,
      payAddress:            order.pay_address,
      payAmount:             order.pay_amount,
      nowpaymentsPaymentId:  order.nowpayments_payment_id,
      deliveryError:         order.delivery_error,
      createdAt:             order.created_at,
      updatedAt:             order.updated_at,
    },
    items: sanitizedItems,
  });
}
