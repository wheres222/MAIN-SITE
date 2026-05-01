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
  /** The reselling.pro order/delivery ID returned on success */
  deliveryId?: string;
  /** The actual product key/license string, if returned directly */
  key?: string;
}

export function isDeliveryConfigured(): boolean {
  return Boolean(DELIVERY_API_KEY);
}

/**
 * Fulfill one unit of a product from reselling.pro by its product ID.
 *
 * This is the primary function used by the checkout webhook.  Pass the
 * reselling.pro product ID (stored in shop_variants.reselling_product_id)
 * and the customer email so reselling.pro can associate the purchase.
 *
 * Adjust the endpoint path / body shape if reselling.pro updates their API.
 */
export async function deliverOrder(
  resellingProductId: string,
  customerEmail: string
): Promise<DeliveryResult> {
  if (!DELIVERY_API_KEY) {
    return { success: false, message: "Delivery API key not configured." };
  }

  const response = await fetch(`${RESELLING_PRO_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DELIVERY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      product_id:     resellingProductId,
      customer_email: customerEmail,
      quantity:       1, // called once per unit — loop at call site
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

  // reselling.pro may return the key directly or as a nested field
  const deliveryId =
    typeof json.id === "string"
      ? json.id
      : typeof json.order_id === "string"
      ? json.order_id
      : undefined;

  const key =
    typeof json.key === "string"
      ? json.key
      : typeof json.license_key === "string"
      ? json.license_key
      : undefined;

  return { success: true, message: "Delivery triggered.", deliveryId, key };
}
