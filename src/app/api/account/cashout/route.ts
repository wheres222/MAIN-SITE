import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { after, NextResponse, type NextRequest } from "next/server";
import { sendCashoutRequestedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, recordSecurityEvent } from "@/lib/security/events";

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

  // Rate limit before any work. This is a withdrawal endpoint and it had no
  // limit at all, which made the balance race below trivially scriptable.
  const limit = rateLimit("cashout", user.id, { windowMs: 10 * 60_000, max: 5 });
  if (limit.limited) {
    after(() =>
      recordSecurityEvent({
        kind: "rate_limited",
        severity: "medium",
        ip: clientIp(request.headers),
        path: "/api/account/cashout",
        method: "POST",
        userId: user.id,
        detail: { attempts: limit.count },
      })
    );
    return NextResponse.json(
      { error: "Too many cashout attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
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

  const roundedAmount = Math.round(parsedAmount * 100) / 100;

  // Create the request through request_cashout rather than inserting here.
  //
  // The old path read profiles.balance, compared, and inserted — three separate
  // steps with nothing held between them and nothing deducted afterwards. Ten
  // sequential $100 requests against a $100 balance therefore all succeeded,
  // because each one re-read the same untouched $100. The function locks the
  // profile row and counts what is already pending, so an over-commitment is
  // rejected by the database rather than by a check that has already gone stale.
  //
  // Service role: the function is SECURITY DEFINER and deliberately not
  // callable by anon or authenticated. See supabase/migrations/cashout_integrity.sql.
  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("request_cashout", {
    p_user_id: user.id,
    p_amount: roundedAmount,
    p_method: method,
    p_address: address.trim(),
  });

  if (rpcError) {
    // The function raises with a readable message for the two cases a customer
    // can act on; anything else is ours and should not be echoed back.
    const message = rpcError.message ?? "";
    if (/Insufficient available balance/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Insufficient available balance. Cashout requests you have already " +
            "submitted are still counted until they are settled.",
        },
        { status: 422 }
      );
    }
    if (/Minimum cashout/i.test(message)) {
      return NextResponse.json({ error: "Minimum cashout amount is $1.00" }, { status: 400 });
    }

    logger.error("request_cashout failed", { route: "account/cashout", err: message });
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
