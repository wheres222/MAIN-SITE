import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { sendCashoutRequestedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const ADDRESS_PATTERNS: Record<string, RegExp> = {
  crypto_btc:  /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{6,87})$/,
  crypto_eth:  /^0x[0-9a-fA-F]{40}$/,
  crypto_ltc:  /^(L[a-km-zA-HJ-NP-Z1-9]{26,33}|M[a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-z0-9]{6,87})$/,
  // USDT: TRC20 (T...) or ERC20/BEP20 (0x...)
  crypto_usdt: /^(T[A-Za-z1-9]{33}|0x[0-9a-fA-F]{40})$/,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify session server-side — never trust client-provided identity
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amount, method, address } = body as Record<string, unknown>;

  // Input validation
  const parsedAmount = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (parsedAmount < 1) {
    return NextResponse.json({ error: "Minimum cashout amount is $1.00" }, { status: 400 });
  }
  if (typeof method !== "string" || !["crypto_btc", "crypto_eth", "crypto_ltc", "crypto_usdt"].includes(method)) {
    return NextResponse.json({ error: "Invalid withdrawal method" }, { status: 400 });
  }
  if (typeof address !== "string" || !ADDRESS_PATTERNS[method as string]?.test(address.trim())) {
    return NextResponse.json({ error: "Invalid wallet address for the selected withdrawal method" }, { status: 400 });
  }

  // Fetch real balance from DB — never trust client-provided balance
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const currentBalance = Number(profile.balance ?? 0);
  const roundedAmount = Math.round(parsedAmount * 100) / 100;

  if (roundedAmount > currentBalance) {
    return NextResponse.json(
      { error: `Insufficient balance. Your balance is $${currentBalance.toFixed(2)}` },
      { status: 422 }
    );
  }

  // Insert cashout request
  const { error: insertError } = await supabase.from("cashout_requests").insert({
    user_id: user.id,
    amount: roundedAmount,
    method,
    address: address.trim(),
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: "Failed to submit request. Please try again." }, { status: 500 });
  }

  // Send confirmation email — non-fatal
  if (user.email) {
    sendCashoutRequestedEmail(user.email, roundedAmount, method as string).catch((err) =>
      logger.error("Failed to send cashout email.", { route: "account/cashout", err: String(err) })
    );
  }

  return NextResponse.json({ success: true, message: "Cashout request submitted successfully." });
}
