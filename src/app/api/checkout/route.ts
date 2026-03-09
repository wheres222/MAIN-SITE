import { NextResponse } from "next/server";
import { createSellAuthCheckout, SellAuthRequestError } from "@/lib/sellauth";
import type { CheckoutRequestInput } from "@/types/sellauth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CHECKOUT_DEDUPE_WINDOW_MS = 45_000;
const CHECKOUT_ENABLED = process.env.CHECKOUT_ENABLED === "true";

type CheckoutLockState = {
  status: "pending" | "ready";
  updatedAt: number;
  redirectUrl: string | null;
  raw?: unknown;
};

function lockStore(): Map<string, CheckoutLockState> {
  const scoped = globalThis as typeof globalThis & {
    __checkoutDedupeStore?: Map<string, CheckoutLockState>;
  };

  if (!scoped.__checkoutDedupeStore) {
    scoped.__checkoutDedupeStore = new Map<string, CheckoutLockState>();
  }

  return scoped.__checkoutDedupeStore;
}

function cleanupLocks(store: Map<string, CheckoutLockState>, now: number) {
  for (const [key, value] of store.entries()) {
    if (now - value.updatedAt > CHECKOUT_DEDUPE_WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function checkoutFingerprint(
  request: Request,
  body: Partial<CheckoutRequestInput>,
  sanitizedItems: Array<{ productId: number; quantity: number; variantId?: number }>
): Promise<string> {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 180);
  const idempotencyKey = (request.headers.get("x-idempotency-key") || "").trim();

  const payload = {
    paymentMethod: String(body.paymentMethod || "").trim().toLowerCase(),
    email: String(body.email || "").trim().toLowerCase(),
    couponCode: String(body.couponCode || "").trim().toLowerCase(),
    items: [...sanitizedItems]
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId || 0,
        quantity: item.quantity,
      }))
      .sort(
        (a, b) =>
          a.productId - b.productId ||
          a.variantId - b.variantId ||
          a.quantity - b.quantity
      ),
  };

  const source = JSON.stringify({
    idempotencyKey,
    clientIp,
    userAgent,
    payload,
  });

  return sha256(source);
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  if (!CHECKOUT_ENABLED) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Checkout is temporarily disabled while payment delivery security checks are in progress.",
      },
      { status: 503 }
    );
  }

  let dedupeKey = "";
  const store = lockStore();

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

    dedupeKey = await checkoutFingerprint(request, body, sanitizedItems);

    const now = Date.now();
    cleanupLocks(store, now);
    const existing = store.get(dedupeKey);

    if (existing && now - existing.updatedAt < CHECKOUT_DEDUPE_WINDOW_MS) {
      if (existing.status === "pending") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Checkout request already in progress. Please wait a few seconds before trying again.",
            deduped: true,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reusing recent checkout session.",
        redirectUrl: existing.redirectUrl,
        data: existing.raw,
        deduped: true,
      });
    }

    store.set(dedupeKey, {
      status: "pending",
      updatedAt: now,
      redirectUrl: null,
    });

    const checkout = await createSellAuthCheckout({
      email: body.email,
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode,
      items: sanitizedItems,
    });

    store.set(dedupeKey, {
      status: "ready",
      updatedAt: Date.now(),
      redirectUrl: checkout.redirectUrl,
      raw: checkout.raw,
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
    if (dedupeKey) {
      store.delete(dedupeKey);
    }

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
