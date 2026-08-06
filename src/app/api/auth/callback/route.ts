import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Auth callback — the landing point for both sign-in flows.
 *
 * Two shapes arrive here and they are not interchangeable:
 *
 *   ?code=...                     OAuth (Discord/Google), and email links when
 *                                 the template uses {{ .ConfirmationURL }}.
 *                                 Redeemed with exchangeCodeForSession.
 *
 *   ?token_hash=...&type=signup   Email links when the template uses
 *                                 {{ .TokenHash }}, which is what Supabase now
 *                                 recommends for server-side rendered apps.
 *                                 Redeemed with verifyOtp.
 *
 * Only the first was handled before. If the Supabase email templates use the
 * TokenHash form — or are ever switched to it — every confirmation link would
 * land here, find no `code`, and bounce the user to the login page with
 * "no authorization code was returned", making working emails look broken.
 *
 * On Vercel the internal `request.url` origin may differ from the public
 * host, so we always prefer the `x-forwarded-host` header when present.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/account";
  const oauthError = searchParams.get("error");

  // Build the correct public origin (handles Vercel reverse-proxy)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const publicOrigin =
    forwardedHost ? `https://${forwardedHost}` : origin;

  /** Send the user back to the login form with something to read, rather than
   *  dropping them on the homepage silently signed-out. */
  const failTo = (message: string) =>
    NextResponse.redirect(
      `${publicOrigin}/login?error=${encodeURIComponent(message)}`
    );

  if (oauthError) {
    const description = searchParams.get("error_description");
    console.error("[auth/callback] provider error:", oauthError, description);
    return failTo(description || oauthError);
  }

  const succeed = () =>
    NextResponse.redirect(
      next.startsWith("/") ? `${publicOrigin}${next}` : publicOrigin
    );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return succeed();

    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return failTo(error.message);
  }

  if (tokenHash && otpType) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (!error) return succeed();

    console.error("[auth/callback] verifyOtp failed:", error.message);
    // Expired links are the common case and the message is opaque, so say
    // what to do about it rather than echoing "Token has expired or is invalid".
    return failTo(
      /expired|invalid/i.test(error.message)
        ? "That confirmation link has expired or was already used. Request a new one."
        : error.message
    );
  }

  return failTo("Sign-in did not complete — no authorization code was returned.");
}
