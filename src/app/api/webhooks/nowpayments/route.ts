import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

const CONFIRMED_STATUSES = new Set(["finished", "confirmed", "partially_paid"]);

function sortObjectKeys(obj: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

export async function POST(request: NextRequest) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    // Not configured — accept silently so NOWPayments doesn't flood retries
    return NextResponse.json({ ok: true });
  }

  const rawBody = await request.text();
  const sigHeader = request.headers.get("x-nowpayments-sig") ?? "";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify HMAC-SHA512 signature
  const expectedSig = createHmac("sha512", ipnSecret)
    .update(sortObjectKeys(payload))
    .digest("hex");

  if (sigHeader !== expectedSig) {
    console.warn("NOWPayments IPN: signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only process confirmed payments
  const status = String(payload.payment_status ?? "");
  if (!CONFIRMED_STATUSES.has(status)) {
    return NextResponse.json({ ok: true });
  }

  const nowpaymentsId = String(payload.payment_id ?? "");
  const txHash = String(payload.outcome_amount ?? payload.payment_id ?? "");
  const actuallyPaidUsd = typeof payload.actually_paid_amount_usd === "number"
    ? payload.actually_paid_amount_usd
    : null;

  if (!nowpaymentsId) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up deposit row — must exist and still be pending (idempotency guard)
  const { data: deposit, error: fetchErr } = await admin
    .from("deposits")
    .select("id, user_id, usd_amount, status")
    .eq("nowpayments_id", nowpaymentsId)
    .single();

  if (fetchErr || !deposit) {
    console.warn("NOWPayments IPN: deposit not found for payment_id", nowpaymentsId);
    return NextResponse.json({ ok: true });
  }

  if (deposit.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  // Credit the amount recorded at intent time — never trust webhook amount
  const creditAmount = deposit.usd_amount;

  const { error: rpcErr } = await admin.rpc("credit_user_balance", {
    p_user_id: deposit.user_id,
    p_amount:  creditAmount,
  });

  if (rpcErr) {
    console.error("credit_user_balance RPC error", rpcErr);
    // Return 500 so NOWPayments retries and we don't lose the payment
    return NextResponse.json({ error: "Balance update failed" }, { status: 500 });
  }

  // Mark deposit confirmed
  await admin
    .from("deposits")
    .update({
      status:  "confirmed",
      tx_hash: txHash,
      ...(actuallyPaidUsd !== null ? { usd_amount: actuallyPaidUsd } : {}),
    })
    .eq("id", deposit.id);

  console.log(`Deposit confirmed: user=${deposit.user_id} +$${creditAmount}`);
  return NextResponse.json({ ok: true });
}
