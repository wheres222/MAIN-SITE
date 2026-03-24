import { NextResponse } from "next/server";
import { deliverOrder, isDeliveryConfigured } from "@/lib/delivery";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// How long to keep a "done" record before allowing re-delivery (24 hours).
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1_000;

type DeliveryState = "pending" | "done" | "failed";

interface DeliveryRecord {
  state: DeliveryState;
  at: number;
}

// Shared in-process store — same pattern as the checkout deduplication.
// Prevents the same order from firing delivery more than once even if
// SellAuth retries the webhook.
function dedupeStore(): Map<string, DeliveryRecord> {
  const scoped = globalThis as typeof globalThis & {
    __deliveryDedupeStore?: Map<string, DeliveryRecord>;
  };
  if (!scoped.__deliveryDedupeStore) {
    scoped.__deliveryDedupeStore = new Map<string, DeliveryRecord>();
  }
  return scoped.__deliveryDedupeStore;
}

function cleanupStore(store: Map<string, DeliveryRecord>, now: number) {
  for (const [key, record] of store.entries()) {
    if (now - record.at > DEDUPE_TTL_MS) {
      store.delete(key);
    }
  }
}

// Optional HMAC-SHA256 signature verification.
// Set SELLAUTH_WEBHOOK_SECRET in your env (and in the SellAuth dashboard) to enable.
async function verifySignature(request: Request, rawBody: string): Promise<boolean> {
  const secret = (process.env.SELLAUTH_WEBHOOK_SECRET || "").trim();
  if (!secret) return true; // skip if not configured

  const signature = request.headers.get("x-sellauth-signature") || "";
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

export async function POST(request: Request) {
  // Always respond 200 to SellAuth. If we return non-2xx, SellAuth will retry
  // the webhook repeatedly — that's what caused the previous overfiring issue.
  const ok = () => NextResponse.json({ received: true }, { status: 200 });

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return ok();
  }

  // Verify signature if a secret is configured.
  const sigValid = await verifySignature(request, rawBody).catch(() => false);
  if (!sigValid) {
    // Return 200 anyway — returning 401/403 would trigger SellAuth retries.
    console.warn("[webhook/sellauth] Signature mismatch — request ignored.");
    return ok();
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return ok();
  }

  const event = typeof body.event === "string" ? body.event : "";
  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  const customerEmail =
    typeof body.customer_email === "string" ? body.customer_email : "";

  // Only act on order completion events. All other events are silently acknowledged.
  if (event !== "order.completed" || !orderId) {
    return ok();
  }

  if (!isDeliveryConfigured()) {
    console.error("[webhook/sellauth] DELIVERY_API_KEY is not set. Order:", orderId);
    return ok();
  }

  const store = dedupeStore();
  const now = Date.now();
  cleanupStore(store, now);

  const existing = store.get(orderId);

  if (existing) {
    if (existing.state === "done") {
      // Already delivered — stop here. This handles SellAuth retries safely.
      console.log("[webhook/sellauth] Order already delivered, skipping:", orderId);
      return ok();
    }
    if (existing.state === "pending") {
      // Delivery is currently in-flight for this order — don't fire a second call.
      console.log("[webhook/sellauth] Order delivery in progress, skipping duplicate:", orderId);
      return ok();
    }
  }

  // Mark as pending before the async call so concurrent webhooks for the
  // same order are blocked immediately.
  store.set(orderId, { state: "pending", at: now });

  try {
    const result = await deliverOrder(orderId, customerEmail);

    if (result.success) {
      store.set(orderId, { state: "done", at: Date.now() });
      console.log("[webhook/sellauth] Delivered order:", orderId, result.deliveryId ?? "");
    } else {
      // Remove from store so a genuine SellAuth retry can attempt again.
      store.delete(orderId);
      console.error("[webhook/sellauth] Delivery failed for order:", orderId, result.message);
    }
  } catch (err) {
    store.delete(orderId);
    console.error("[webhook/sellauth] Unexpected error for order:", orderId, err);
  }

  // Always 200 — never let SellAuth see an error status that would cause retries.
  return ok();
}
