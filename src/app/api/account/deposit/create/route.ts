import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

// NOWPayments currency tickers differ from our display names
const CURRENCY_MAP: Record<string, string> = {
  btc:  "btc",
  eth:  "eth",
  sol:  "sol",
  ltc:  "ltc",
  usdt: "usdttrc20",
  usdc: "usdc",
  bnb:  "bnb",
  busd: "busd",
  doge: "doge",
  trx:  "trx",
  xrp:  "xrp",
};

const ALLOWED_CURRENCIES = Object.keys(CURRENCY_MAP);

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amount, currency } = body as Record<string, unknown>;

  if (typeof amount !== "number" || amount < 1 || !isFinite(amount)) {
    return NextResponse.json({ error: "Minimum deposit is $1.00" }, { status: 422 });
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
      console.error("NOWPayments error", resp.status, err);
      await admin.from("deposits").delete().eq("id", depositRow.id);
      return NextResponse.json({ error: "Payment provider error. Try again." }, { status: 502 });
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
