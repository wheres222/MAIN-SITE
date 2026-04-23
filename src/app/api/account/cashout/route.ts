import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

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
  if (typeof address !== "string" || address.trim().length < 10) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
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

  return NextResponse.json({ success: true, message: "Cashout request submitted successfully." });
}
