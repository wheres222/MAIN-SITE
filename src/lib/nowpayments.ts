/**
 * NOWPayments server-side wrapper — SERVER SIDE ONLY.
 * Never import from client components.
 */
import "server-only";
import { createHmac } from "crypto";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY ?? "";
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET ?? "";
const BASE_URL = "https://api.nowpayments.io/v1";

// Map from our short ticker to the NOWPayments pay_currency value
export const CURRENCY_MAP: Record<string, string> = {
  btc:  "btc",
  eth:  "eth",
  sol:  "sol",
  ltc:  "ltc",
  usdt: "usdttrc20",
  usdc: "usdc",
  bnb:  "bnb",
  doge: "doge",
  trx:  "trx",
  xrp:  "xrp",
};

export const ALLOWED_CURRENCIES = Object.keys(CURRENCY_MAP);

export interface CreatePaymentParams {
  /** Amount in USD */
  usdAmount: number;
  /** NOWPayments pay_currency value (from CURRENCY_MAP) */
  payCurrency: string;
  /** Our internal order ID — stored as NOWPayments order_id */
  orderId: string;
  /** Full URL for IPN callbacks */
  ipnCallbackUrl: string;
  orderDescription?: string;
}

export interface NowPaymentsPayment {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  expiration_estimate_date: string;
  payment_status: string;
}

/**
 * Create a new NOWPayments payment invoice.
 * Throws on API error so callers can handle and clean up.
 */
export async function createNowPayment(
  params: CreatePaymentParams
): Promise<NowPaymentsPayment> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error("NOWPayments API key not configured");
  }

  const resp = await fetch(`${BASE_URL}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount:     params.usdAmount,
      price_currency:   "usd",
      pay_currency:     params.payCurrency,
      order_id:         params.orderId,
      ipn_callback_url: params.ipnCallbackUrl,
      ...(params.orderDescription
        ? { order_description: params.orderDescription }
        : {}),
    }),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `NOWPayments API error ${resp.status}: ${text.slice(0, 300)}`
    );
  }

  return resp.json() as Promise<NowPaymentsPayment>;
}

/**
 * Verify a NOWPayments IPN callback signature.
 *
 * NOWPayments signs with HMAC-SHA512 of the JSON body with keys sorted
 * alphabetically, using the IPN secret key.
 * Signature is in the `x-nowpayments-sig` request header.
 */
export function verifyIpnSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!NOWPAYMENTS_IPN_SECRET || !signature) return false;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return false;
  }

  const sortedJson = JSON.stringify(sortObjectKeys(payload));
  const expected = createHmac("sha512", NOWPAYMENTS_IPN_SECRET)
    .update(sortedJson)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sortObjectKeys(
  obj: Record<string, unknown>
): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const val = obj[key];
      acc[key] =
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val)
          ? sortObjectKeys(val as Record<string, unknown>)
          : val;
      return acc;
    }, {});
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
