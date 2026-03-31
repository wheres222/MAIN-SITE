import { NextResponse } from "next/server";
import { createSellAuthCheckout, SellAuthRequestError } from "@/lib/sellauth";
import type { CheckoutRequestInput } from "@/types/sellauth";

export const dynamic = "force-dynamic";

const CHECKOUT_DEDUPE_WINDOW_MS = 45_000;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHECKOUT_RATE_LIMIT_MAX = 6;
const CHECKOUT_ENABLED = process.env.CHECKOUT_FORCE_DISABLE !== "true";

type CheckoutLockState = {
  status: "pending" | "ready";
  updatedAt: number;
  redirectUrl: string | null;
  raw?: unknown;
};

type CheckoutRateState = {
  count: number;
  updatedAt: number;
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

function rateStore(): Map<string, CheckoutRateState> {
  const scoped = globalThis as typeof globalThis & {
    __checkoutRateStore?: Map<string, CheckoutRateState>;
  };

  if (!scoped.__checkoutRateStore) {
    scoped.__checkoutRateStore = new Map<string, CheckoutRateState>();
  }

  return scoped.__checkoutRateStore;
}

function clientIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

function cleanupLocks(store: Map<string, CheckoutLockState>, now: number) {
  for (const [key, value] of store.entries()) {
    if (now - value.updatedAt > CHECKOUT_DEDUPE_WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}

function cleanupRates(store: Map<string, CheckoutRateState>, now: number) {
  for (const [key, value] of store.entries()) {
    if (now - value.updatedAt > CHECKOUT_RATE_LIMIT_WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}

function isRateLimited(store: Map<string, CheckoutRateState>, key: string, now: number): boolean {
  const existing = store.get(key);

  if (!existing || now - existing.updatedAt > CHECKOUT_RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, updatedAt: now });
    return false;
  }

  existing.count += 1;
  existing.updatedAt = now;
  store.set(key, existing);

  return existing.count > CHECKOUT_RATE_LIMIT_MAX;
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
  const clientIp = clientIpFromRequest(request);
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
        message: "Checkout is currently paused by security policy.",
      },
      { status: 503 }
    );
  }

  let dedupeKey = "";
  const store = lockStore();
  const checkoutRates = rateStore();

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
    cleanupRates(checkoutRates, now);

    const rateKey = await sha256(
      `${clientIpFromRequest(request)}|${(request.headers.get("user-agent") || "").slice(0, 120)}`
    );
    if (isRateLimited(checkoutRates, rateKey, now)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many checkout attempts. Please wait a minute and try again.",
        },
        { status: 429 }
      );
    }

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
