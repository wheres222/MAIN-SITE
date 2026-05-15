/**
 * GET /api/order/guest/[orderId]
 *
 * Public order status endpoint — no auth required.
 * The UUID order ID itself acts as an unguessable token.
 * Returns order status, payment details, and (once delivered) the keys.
 *
 * To prevent scraping, delivery_keys are only exposed after the order
 * reaches "delivered" status.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Basic UUID shape check (prevents DB queries for obviously wrong values)
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("shop_orders")
    .select(
      "id, status, email, total_usd, pay_currency, pay_address, pay_amount, delivery_error, created_at, updated_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: items } = await admin
    .from("shop_order_items")
    .select("id, product_name, variant_name, quantity, unit_price_usd, delivery_keys, delivered_at")
    .eq("order_id", orderId);

  const isDelivered = order.status === "delivered";

  const sanitizedItems = (items ?? []).map((item) => ({
    id:             item.id,
    product_name:   item.product_name,
    variant_name:   item.variant_name,
    quantity:       item.quantity,
    unit_price_usd: item.unit_price_usd,
    // Only expose keys once fully delivered
    delivery_keys:  isDelivered ? (item.delivery_keys ?? []) : [],
    delivered_at:   isDelivered ? item.delivered_at : null,
  }));

  return NextResponse.json({
    order: {
      id:            order.id,
      status:        order.status,
      email:         maskEmail(order.email as string),
      totalUsd:      order.total_usd,
      payCurrency:   order.pay_currency,
      // Only expose payment address while still pending
      payAddress:    order.status === "pending" ? order.pay_address : null,
      payAmount:     order.status === "pending" ? order.pay_amount  : null,
      deliveryError: order.delivery_error,
      createdAt:     order.created_at,
      updatedAt:     order.updated_at,
    },
    items: sanitizedItems,
  });
}

/** Mask email for display: a***@example.com */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const masked = local.length <= 2 ? local : local[0] + "***";
  return `${masked}@${domain}`;
}
