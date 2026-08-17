import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeDepositSession } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, recordSecurityEvent } from "@/lib/security/events";
import { after, NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Matches the crypto route's floor, and caps a single card top-up. */
const MIN_USD = 1;
const MAX_USD = 150;

/**
 * Start a card deposit.
 *
 * The row is written before the Stripe session exists so the webhook always has
 * something to find — the reverse order leaves a window where a customer has
 * paid and nothing in our database knows why. The amount is recorded here and
 * the webhook credits *this* number, never the one the webhook reports, so a
 * forged callback cannot inflate a balance.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Keyed on the user rather than the IP: this route already requires a
  // session, and a shared IP (a university, a phone network) should not stop
  // one customer topping up because another just did.
  const limit = rateLimit("deposit", user.id, { windowMs: 10 * 60_000, max: 8 });
  if (limit.limited) {
    after(() =>
      recordSecurityEvent({
        kind: "rate_limited",
        severity: "medium",
        ip: clientIp(request.headers),
        path: "/api/account/deposit/stripe",
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

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Card deposits are not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amount } = body as Record<string, unknown>;

  if (typeof amount !== "number" || !isFinite(amount) || amount < MIN_USD) {
    return NextResponse.json(
      { error: `Minimum deposit is $${MIN_USD.toFixed(2)}` },
      { status: 422 }
    );
  }
  if (amount > MAX_USD) {
    return NextResponse.json(
      { error: `Maximum card deposit is $${MAX_USD.toFixed(2)}` },
      { status: 422 }
    );
  }

  const usdAmount = Math.round(amount * 100) / 100;
  const admin = createAdminClient();

  const { data: depositRow, error: insertErr } = await admin
    .from("deposits")
    .insert({
      user_id: user.id,
      usd_amount: usdAmount,
      provider: "stripe",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !depositRow) {
    // The most likely cause is supabase/migrations/stripe_deposits.sql not
    // having been applied, which leaves provider missing and crypto_symbol
    // still NOT NULL. Say so rather than returning a bare 500.
    logger.error("Deposit insert failed", {
      route: "api/account/deposit/stripe",
      err: insertErr?.message ?? "no row returned",
    });
    return NextResponse.json(
      { error: "Could not start deposit. Please contact support." },
      { status: 500 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const session = await createStripeDepositSession({
      depositId: depositRow.id,
      usdAmount,
      customerEmail: user.email ?? undefined,
      successUrl: `${siteUrl}/account/deposit?status=success`,
      cancelUrl: `${siteUrl}/account/deposit?status=cancelled`,
    });

    await admin
      .from("deposits")
      .update({ stripe_session_id: session.sessionId })
      .eq("id", depositRow.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // No session means nothing can ever confirm this row, so remove it rather
    // than leaving a permanent pending deposit in the customer's history.
    await admin.from("deposits").delete().eq("id", depositRow.id);
    logger.error("Stripe deposit session failed", {
      route: "api/account/deposit/stripe",
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Payment provider error. Please try again." },
      { status: 502 }
    );
  }
}
