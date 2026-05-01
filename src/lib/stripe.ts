/**
 * Stripe server-side wrapper — SERVER SIDE ONLY.
 * Never import from client components.
 */
import "server-only";
import Stripe from "stripe";

// Lazy singleton — avoids crashing the build when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    telemetry: false,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Cart item passed in from the checkout route. */
export interface StripeLineItem {
  productName: string;
  variantName: string;
  quantity:    number;
  unitPriceUsd: number; // in dollars, e.g. 9.99
}

/**
 * Create a Stripe Checkout Session for shop orders.
 * Returns the session URL to redirect the customer to.
 *
 * Security: prices come from our own DB, never from the client.
 */
export async function createStripeCheckoutSession(params: {
  orderId:      string;
  lineItems:    StripeLineItem[];
  customerEmail: string;
  successUrl:   string;
  cancelUrl:    string;
}): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode:                "payment",
    customer_email:      params.customerEmail,
    payment_method_types: ["card"],
    line_items: params.lineItems.map((li) => ({
      quantity: li.quantity,
      price_data: {
        currency:     "usd",
        unit_amount:  Math.round(li.unitPriceUsd * 100), // cents
        product_data: {
          name:        `${li.productName} — ${li.variantName}`,
          description: `CheatParadise — Instant digital delivery`,
        },
      },
    })),
    metadata: {
      // Tie this session back to our order row
      shop_order_id: params.orderId,
    },
    success_url: params.successUrl,
    cancel_url:  params.cancelUrl,
    // Expire after 30 minutes — keeps DB clean
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    // No physical goods
    shipping_address_collection: undefined,
    // Allow customer to adjust quantity — NO (our cart controls that)
    // billing_address_collection: "auto",
    payment_intent_data: {
      // Appear as "CHEATPARADISE" on bank statements
      statement_descriptor_suffix: "CHEATPARADISE",
      metadata: {
        shop_order_id: params.orderId,
      },
    },
  });

  return {
    sessionId: session.id,
    url:       session.url ?? "",
  };
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Throws if the signature is invalid.
 */
export function constructStripeEvent(
  rawBody: string | Buffer,
  signature:  string,
  secret:     string
): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
