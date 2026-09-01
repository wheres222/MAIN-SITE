import { NextResponse } from "next/server";

import { sendOrderDeliveredEmail } from "@/lib/email";
import { claimDeliveryRecord, setDeliveryRecord, failDeliveryRecord } from "@/lib/dedupe";
import { logger } from "@/lib/logger";
import { completeSellAuthOrder } from "@/lib/order-records";

export const dynamic = "force-dynamic";

// HMAC-SHA256 signature verification — required for all incoming webhook requests.
// SELLAUTH_WEBHOOK_SECRET must be set in env and in the SellAuth dashboard > Webhooks > Secret.
async function verifySignature(request: Request, rawBody: string): Promise<{ valid: boolean; secretMissing: boolean }> {
  const secret = (process.env.SELLAUTH_WEBHOOK_SECRET || "").trim();
  if (!secret) return { valid: false, secretMissing: true };

  const signature = request.headers.get("x-sellauth-signature") || "";
  if (!signature) return { valid: false, secretMissing: false };

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

  // Mark the order paid and pay any referral commission on it. Nothing used to
  // do either, which is why a completed order never appeared in the buyer's
  // account and no referrer was ever credited.
  //
  // Idempotent by construction: it only updates rows still in "pending", so a
  // SellAuth webhook retry updates nothing and cannot pay twice.
  await completeSellAuthOrder(orderId);

  // SellAuth delivers the product itself when the invoice is paid, so there is
  // nothing for us to fulfil on this path.
  //
  // This used to call deliverOrder(orderId, …) against reselling.pro. That was
  // wrong twice over: the parameter is a reselling.pro *product* id, not a
  // SellAuth *order* id, and reselling.pro no longer exists at all. The call
  // failed on every completed order, which marked the delivery record failed —
  // and /api/order/[orderId] reads that record, so buyers who had already
  // received their key from SellAuth were shown "Delivery failed. Please
  // contact support."
  //
  // The record is still claimed and marked done so that endpoint reports the
  // truth, and so the confirmation email is sent exactly once per order.
  const claimed = await claimDeliveryRecord(orderId);
  if (!claimed) {
    logger.info("Order already recorded — skipping duplicate.", { route: "webhook/sellauth", orderId });
    return ok();
  }

  try {
    await setDeliveryRecord(orderId, "done");
    logger.info("Order completed — delivered by SellAuth.", { route: "webhook/sellauth", orderId });

    if (customerEmail) {
      sendOrderDeliveredEmail(customerEmail, orderId).catch((err) =>
        logger.error("Failed to send delivery email.", { route: "webhook/sellauth", orderId, err: String(err) })
      );
    }
  } catch (err) {
    await failDeliveryRecord(orderId, String(err));
    logger.error("Unexpected error recording completion.", { route: "webhook/sellauth", orderId, err: String(err) });
  }

  // Always 200 — never let SellAuth see an error status that would cause retries.
  return ok();
}
