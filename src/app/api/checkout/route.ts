import { NextResponse } from "next/server";
import { createSellAuthCheckout, SellAuthRequestError } from "@/lib/sellauth";
import type { CheckoutRequestInput } from "@/types/sellauth";

export const dynamic = "force-dynamic";

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CheckoutRequestInput>;

    if (!body.paymentMethod || typeof body.paymentMethod !== "string") {
      return invalid("paymentMethod is required.");
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return invalid("At least one cart item is required.");
    }

    const sanitizedItems = body.items
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity || 1),
        ...(item.variantId ? { variantId: Number(item.variantId) } : {}),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.productId) &&
          item.productId > 0 &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0
      );

    if (sanitizedItems.length === 0) {
      return invalid("Cart items are invalid.");
    }

    const checkout = await createSellAuthCheckout({
      email: body.email,
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode,
      items: sanitizedItems,
    });

    return NextResponse.json({
      success: true,
      message: checkout.redirectUrl
        ? "Checkout created successfully."
        : "Checkout created. No redirect URL returned.",
      redirectUrl: checkout.redirectUrl,
      data: checkout.raw,
    });
  } catch (error) {
    if (error instanceof SellAuthRequestError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    const message =
      error instanceof Error ? error.message : "Unable to create checkout.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
