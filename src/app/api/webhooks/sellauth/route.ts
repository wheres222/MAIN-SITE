import { NextResponse } from "next/server";
import { deliverOrder, isDeliveryConfigured } from "@/lib/delivery";
import { sendOrderDeliveredEmail } from "@/lib/email";
import { getDeliveryRecord, setDeliveryRecord, deleteDeliveryRecord } from "@/lib/dedupe";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// HMAC-SHA256 signature verification — required for all incoming webhook requests.
// SELLAUTH_WEBHOOK_SECRET must be set in env and in the SellAuth dashboard > Webhooks > Secret.
async function verifySignature(request: Request, rawBody: string): Promise<{ valid: boolean; secretMissing: boolean }> {
  const secret = (process.env.SELLAUTH_WEBHOOK_SECRET || "").trim();
  if (!secret) return { valid: false, secretMissing: true };

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

  return { valid: signature === expected, secretMissing: false };
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

  // Signature verification is mandatory. SELLAUTH_WEBHOOK_SECRET must be configured.
  const sigResult = await verifySignature(request, rawBody).catch(() => ({ valid: false, secretMissing: false }));
  if (sigResult.secretMissing) {
    logger.error("SELLAUTH_WEBHOOK_SECRET is not set — all webhooks are blocked until configured.", { route: "webhook/sellauth" });
    return ok();
  }
  if (!sigResult.valid) {
    logger.warn("Signature mismatch — request rejected.", { route: "webhook/sellauth" });
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
    logger.error("DELIVERY_API_KEY is not set.", { route: "webhook/sellauth", orderId });
    return ok();
  }

  // DB-backed deduplication — survives server restarts and cold starts.
  const existing = await getDeliveryRecord(orderId);

  if (existing) {
    if (existing.state === "done") {
      logger.info("Order already delivered, skipping.", { route: "webhook/sellauth", orderId });
      return ok();
    }
    if (existing.state === "pending") {
      logger.info("Order delivery in progress, skipping duplicate.", { route: "webhook/sellauth", orderId });
      return ok();
    }
  }

  await setDeliveryRecord(orderId, "pending");

  try {
    const result = await deliverOrder(orderId, customerEmail);

    if (result.success) {
      await setDeliveryRecord(orderId, "done", result.deliveryId ?? undefined);
      logger.info("Order delivered.", { route: "webhook/sellauth", orderId, deliveryId: result.deliveryId });
      if (customerEmail) {
        sendOrderDeliveredEmail(customerEmail, orderId).catch((err) =>
          logger.error("Failed to send delivery email.", { route: "webhook/sellauth", orderId, err: String(err) })
        );
      }
    } else {
      await deleteDeliveryRecord(orderId);
      logger.error("Delivery failed.", { route: "webhook/sellauth", orderId, message: result.message });
    }
  } catch (err) {
    await deleteDeliveryRecord(orderId);
    logger.error("Unexpected error during delivery.", { route: "webhook/sellauth", orderId, err: String(err) });
  }

  // Always 200 — never let SellAuth see an error status that would cause retries.
  return ok();
}
