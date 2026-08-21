import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { after, NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, recordSecurityEvent } from "@/lib/security/events";

// NOWPayments currency tickers differ from our display names
const CURRENCY_MAP: Record<string, string> = {
  btc:  "btc",
  eth:  "eth",
  sol:  "sol",
  ltc:  "ltc",
  usdt: "usdttrc20",
  bnb:  "bnb",
  busd: "busd",
};

const ALLOWED_CURRENCIES = Object.keys(CURRENCY_MAP);

/**
 * Turn a NOWPayments failure into something the customer can act on.
 *
 * This route used to answer every provider failure with "Payment provider
 * error. Try again." while logging the real reason server-side only. Retrying
 * does not help when the amount is under the coin's minimum — the common case,
 * because that minimum is per-coin and usually far above this site's $1 floor —
 * so the customer just failed again with no idea why.
 *
 * Authentication faults are deliberately NOT surfaced. A customer can do
 * nothing about an expired key, and naming it tells an attacker which half of
 * the integration is broken.
 */
function describeNowPaymentsError(
  status: number,
  raw: string
): { message: string; httpStatus: number; configProblem: boolean } {
  let code = "";
  let providerMessage = "";
  try {
    const parsed = JSON.parse(raw) as { code?: unknown; message?: unknown };
    code = typeof parsed.code === "string" ? parsed.code : "";
    providerMessage = typeof parsed.message === "string" ? parsed.message : "";
  } catch {
    // Not JSON — fall through to the generic message.
  }

  const combined = code + " " + providerMessage;

  // The provider names the real minimum, usually with a fiat equivalent, which
  // is exactly what the customer needs in order to proceed.
  if (code === "AMOUNT_MINIMAL_ERROR" || /minimal|too small|minimum/i.test(providerMessage)) {
    const detail = providerMessage.replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      message: detail
        ? "That amount is below this coin's minimum. " + detail + " Try a larger amount or a different coin."
        : "That amount is below this coin's minimum. Try a larger amount or a different coin.",
      httpStatus: 422,
      configProblem: false,
    };
  }

  if (status === 401 || status === 403 || /api.?key|auth|forbidden/i.test(combined)) {
    return {
      message: "Deposits are temporarily unavailable. Please try again shortly.",
      httpStatus: 503,
      configProblem: true,
    };
  }

  if (/currency|not found|not available|disabled|unsupported/i.test(combined)) {
    return {
      message: "That coin is not available for deposits right now. Please choose another.",
      httpStatus: 422,
      configProblem: false,
    };
  }

  return {
    message: "The payment provider rejected this deposit. Try a different amount or coin.",
    httpStatus: 502,
    configProblem: false,
  };
}

// A ceiling existed nowhere on this route. NOWPayments would happily quote an
// address for a six-figure invoice, and the row it writes is what the webhook
// later credits.
const MAX_USD = 500;

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit before touching the provider or the database. Keyed on the
  // user, matching the card route.
  const limit = rateLimit("deposit", user.id, { windowMs: 10 * 60_000, max: 8 });
  if (limit.limited) {
    after(() =>
      recordSecurityEvent({
        kind: "rate_limited",
        severity: "medium",
        ip: clientIp(request.headers),
        path: "/api/account/deposit/create",
        method: "POST",
        userId: user.id,
        detail: { attempts: limit.count },
      })
    );
    return NextResponse.json(
      { error: "Too many deposit attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // 3. Parse + validate body
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amount, currency } = body as Record<string, unknown>;

  if (typeof amount !== "number" || amount < 1 || !isFinite(amount)) {
    return NextResponse.json({ error: "Minimum deposit is $1.00" }, { status: 422 });
  }
  if (amount > MAX_USD) {
    return NextResponse.json(
      { error: `Maximum deposit is $${MAX_USD.toLocaleString()}` },
      { status: 422 }
    );
  }
  if (typeof currency !== "string" || !ALLOWED_CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 422 });
  }

  const usdAmount = Math.round(amount * 100) / 100;
  const nowCurrency = CURRENCY_MAP[currency];

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Deposit service not configured" }, { status: 503 });
  }

  // 3. Pre-create deposit row to get our internal ID (used as NOWPayments order_id)
  const admin = createAdminClient();
  const { data: depositRow, error: insertErr } = await admin
    .from("deposits")
    .insert({
      user_id:      user.id,
      usd_amount:   usdAmount,
      crypto_symbol: currency,
      pay_address:  "pending",
      status:       "pending",
    })
    .select("id")
    .single();

  if (insertErr || !depositRow) {
    console.error("deposit insert error", insertErr);
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
  }

  // 4. Create payment with NOWPayments
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  let nowData: {
    payment_id: string;
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    expiration_estimate_date: string;
  };

  try {
    const resp = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount:    usdAmount,
        price_currency:  "usd",
        pay_currency:    nowCurrency,
        order_id:        depositRow.id,
        ipn_callback_url: `${siteUrl}/api/webhooks/nowpayments`,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      const described = describeNowPaymentsError(resp.status, err);

      // Logged either way, and loudly when it is a configuration fault: an
      // expired key fails every deposit on the site, and the only symptom a
      // customer can report is that it "did not work".
      if (described.configProblem) {
        console.error(
          "NOWPayments rejected the request — check NOWPAYMENTS_API_KEY",
          resp.status,
          err
        );
      } else {
        console.warn("NOWPayments declined a deposit", resp.status, err);
      }

      await admin.from("deposits").delete().eq("id", depositRow.id);
      return NextResponse.json({ error: described.message }, { status: described.httpStatus });
    }

    nowData = await resp.json() as typeof nowData;
  } catch (e) {
    console.error("NOWPayments fetch failed", e);
    await admin.from("deposits").delete().eq("id", depositRow.id);
    return NextResponse.json({ error: "Could not reach payment provider" }, { status: 502 });
  }

  // 5. Update deposit row with real NOWPayments data
  await admin
    .from("deposits")
    .update({
      nowpayments_id: nowData.payment_id,
      pay_address:    nowData.pay_address,
      pay_amount:     nowData.pay_amount,
    })
    .eq("id", depositRow.id);

  return NextResponse.json({
    payment_id:  nowData.payment_id,
    pay_address: nowData.pay_address,
    pay_amount:  nowData.pay_amount,
    pay_currency: nowData.pay_currency,
    expires_at:  nowData.expiration_estimate_date,
    deposit_id:  depositRow.id,
  });
}
