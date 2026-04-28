import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * OAuth callback — Supabase lands here after Discord (or any provider)
 * authorization.  We exchange the one-time code for a session and redirect
 * the user to their intended destination.
 *
 * On Vercel the internal `request.url` origin may differ from the public
 * host, so we always prefer the `x-forwarded-host` header when present.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const oauthError = searchParams.get("error");

  // Build the correct public origin (handles Vercel reverse-proxy)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const publicOrigin =
    forwardedHost ? `https://${forwardedHost}` : origin;

  if (oauthError) {
    console.error("[auth/callback] provider error:", oauthError, searchParams.get("error_description"));
    return NextResponse.redirect(`${publicOrigin}/`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = next.startsWith("/")
        ? `${publicOrigin}${next}`
        : publicOrigin;
      return NextResponse.redirect(destination);
    }

    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  // Fallback — something went wrong, send home
  return NextResponse.redirect(`${publicOrigin}/`);
}
