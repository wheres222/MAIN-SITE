/**
 * reselling.pro delivery integration — SERVER SIDE ONLY.
 * This module must never be imported from client components.
 * The DELIVERY_API_KEY is read from process.env and never exposed.
 */
import "server-only";

function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return "";
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  normalized = normalized.replace(/\\\|/g, "|");
  return normalized;
}

const DELIVERY_API_KEY = normalizeEnvSecret(process.env.DELIVERY_API_KEY) || "";
const RESELLING_PRO_BASE_URL = "https://reselling.pro/api";

export interface DeliveryResult {
  success: boolean;
  message: string;
  deliveryId?: string;
}

export function isDeliveryConfigured(): boolean {
  return Boolean(DELIVERY_API_KEY);
}

/**
 * Trigger key delivery for a completed order via reselling.pro.
 *
 * Adjust the endpoint path and body shape to match reselling.pro's actual API
 * docs — only the auth header pattern is stable here.
 */
export async function deliverOrder(
  orderId: string,
  customerEmail: string
): Promise<DeliveryResult> {
  if (!DELIVERY_API_KEY) {
    return { success: false, message: "Delivery API key not configured." };
  }

  const response = await fetch(`${RESELLING_PRO_BASE_URL}/deliver`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DELIVERY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      customer_email: customerEmail,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      success: false,
      message: `reselling.pro returned ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const deliveryId = typeof json.id === "string" ? json.id : undefined;

  return { success: true, message: "Delivery triggered.", deliveryId };
}
