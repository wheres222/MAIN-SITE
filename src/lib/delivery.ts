/**
 * Delivery integration — SERVER SIDE ONLY.
 * This module must never be imported from client components.
 * API keys are read from process.env and never exposed.
 *
 * Two providers live behind one entry point, `fulfillVariant()`:
 *   • Seryx      — variants carrying seryx_game + seryx_plan_type
 *   • reselling.pro — everything else (the original path)
 */
import "server-only";
import { sendSecurityAlert } from "@/lib/alerts";
import {
  findSeryxPlan,
  generateSeryxKeys,
  isSeryxConfigured,
  type SeryxGame,
} from "@/lib/seryx";

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

/* ─────────────────────────────────────────────────────────────────────────────
   Provider dispatch
   ───────────────────────────────────────────────────────────────────────────*/

/** The variant columns delivery cares about. */
export interface DeliverableVariant {
  reselling_product_id?: string | null;
  sellauth_id?: string | null;
  seryx_game?: string | null;
  seryx_plan_type?: string | null;
}

export interface FulfillmentResult {
  /** Keys actually obtained. May be shorter than `quantity` on partial failure. */
  keys: string[];
  /** Human-readable failures, one per unit or per batch depending on provider. */
  errors: string[];
  /** Set when the Seryx wallet is empty — worth alerting on, not just logging. */
  outOfBalance?: boolean;
}

export function variantProvider(
  variant: DeliverableVariant
): "seryx" | "reselling" | "none" {
  if (findSeryxPlan(variant.seryx_game, variant.seryx_plan_type)) return "seryx";
  if (variant.reselling_product_id || variant.sellauth_id) return "reselling";
  return "none";
}

/**
 * Fulfil one order line, whatever provider backs it.
 *
 * `idempotencySeed` should be the order item id: stable across webhook retries,
 * unique per line. Seryx uses it to avoid double-charging the wallet;
 * reselling.pro has no idempotency support, so it is unused there — that path
 * is protected only by the order-level pending→paid lock in the webhooks.
 */
export async function fulfillVariant(params: {
  variant: DeliverableVariant;
  quantity: number;
  customerEmail: string;
  idempotencySeed: string;
  variantLabel: string;
}): Promise<FulfillmentResult> {
  const { variant, quantity, customerEmail, idempotencySeed, variantLabel } = params;

  switch (variantProvider(variant)) {
    case "seryx": {
      if (!isSeryxConfigured()) {
        return { keys: [], errors: [`SERYX_API_KEY not configured — cannot deliver "${variantLabel}"`] };
      }
      const result = await generateSeryxKeys({
        game: variant.seryx_game as SeryxGame,
        planType: variant.seryx_plan_type as string,
        quantity,
        idempotencySeed,
      });
      // An empty wallet fails every subsequent order too, so it is worth waking
      // someone up rather than only landing in the log. Throttled to one alert
      // per 15 minutes by sendSecurityAlert, and never allowed to throw — a
      // Discord outage must not stop a customer receiving what they paid for.
      if (result.outOfBalance) {
        sendSecurityAlert({
          kind: "seryx_balance_empty",
          ip: null,
          path: null,
          detail: { variant: variantLabel, message: result.message },
        }).catch(() => {});
      }

      return {
        keys: result.keys,
        errors: result.success
          ? []
          : [`Seryx delivery failed for "${variantLabel}": ${result.message}`],
        outOfBalance: result.outOfBalance,
      };
    }

    case "reselling": {
      const productId = (variant.reselling_product_id || variant.sellauth_id) as string;
      const keys: string[] = [];
      const errors: string[] = [];

      // reselling.pro has no batch endpoint, so this stays a per-unit loop.
      for (let unit = 0; unit < quantity; unit++) {
        const result = await deliverOrder(productId, customerEmail);
        if (!result.success) {
          errors.push(
            `Delivery failed for "${variantLabel}" (unit ${unit + 1}): ${result.message}`
          );
        } else {
          keys.push(result.key ?? result.deliveryId ?? "delivered");
        }
      }
      return { keys, errors };
    }

    default:
      return {
        keys: [],
        errors: [`No delivery provider configured for variant "${variantLabel}"`],
      };
  }
}
