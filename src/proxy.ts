import { createServerClient } from "@supabase/ssr";
import { NextResponse, after, type NextRequest } from "next/server";
import { detectThreats, isAdminPath } from "@/lib/security/detect";
import {
  clientCountry,
  clientIp,
  recordDetections,
  recordSecurityEvent,
} from "@/lib/security/events";

// ── Maintenance mode ─────────────────────────────────────────────────────────
const MAINTENANCE_MODE  = false;               // ← flip to true to close the site
const PREVIEW_COOKIE    = "cp_preview";
const MAINTENANCE_PATH  = "/maintenance";

/**
 * ?preview=<secret> grants access while maintenance mode is on.
 *
 * Read from the environment, never inlined: this file is committed, so a
 * literal here is a published bypass token for anyone who reads the repo.
 * When the variable is unset the bypass is disabled outright rather than
 * degrading to an empty-string match that `?preview=` would satisfy.
 */
const PREVIEW_SECRET = process.env.MAINTENANCE_PREVIEW_SECRET?.trim() || null;

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Security telemetry ─────────────────────────────────────────────────────
  // detectThreats is pure string work on every request; the Supabase write only
  // happens when something actually matched, and runs inside after() so it is
  // off the response path entirely.
  const threats = detectThreats({
    method: request.method,
    path: pathname,
    query: request.nextUrl.search.replace(/^\?/, ""),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  if (threats.length > 0) {
    const context = {
      ip: clientIp(request.headers),
      country: clientCountry(request.headers),
      userAgent: request.headers.get("user-agent"),
      method: request.method,
      path: pathname,
      query: request.nextUrl.search.replace(/^\?/, ""),
    };
    after(() => recordDetections(threats, context));
  }

  // Always pass through maintenance page + static assets
  const isPassthrough =
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/branding/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/social/") ||
    pathname.startsWith("/placeholders/") ||
    /\.(ico|png|jpg|jpeg|webp|svg|gif|css|js|woff2?)$/.test(pathname);

  if (!isPassthrough) {
    const attempted = searchParams.get("preview");

    // Grant preview access via ?preview=<secret> — set cookie + redirect clean
    if (PREVIEW_SECRET !== null && attempted === PREVIEW_SECRET) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("preview");
      const res = NextResponse.redirect(url);
      res.cookies.set(PREVIEW_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return res;
    }

    // A wrong guess is someone trying to get behind the maintenance gate.
    if (attempted !== null) {
      after(() =>
        recordSecurityEvent({
          kind: "preview_secret_failed",
          severity: "medium",
          ip: clientIp(request.headers),
          country: clientCountry(request.headers),
          userAgent: request.headers.get("user-agent"),
          method: request.method,
          path: pathname,
          detail: { configured: PREVIEW_SECRET !== null },
        })
      );
    }

    // Maintenance gate: redirect everyone without the preview cookie
    // Skip in local dev so you can always see the site at localhost
    const isDev = process.env.NODE_ENV === "development";
    if (MAINTENANCE_MODE && !isDev && request.cookies.get(PREVIEW_COOKIE)?.value !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = MAINTENANCE_PATH;
      return NextResponse.rewrite(url);
    }
  }

  // ── Supabase auth ──────────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every touch of the admin surface is recorded, allowed or not. The guard in
  // src/lib/auth/guard.ts records the *denials*; this records the attempt, so a
  // probe against /admin still leaves a trace even when it never reaches a page.
  if (isAdminPath(pathname)) {
    after(() =>
      recordSecurityEvent({
        kind: "admin_access",
        severity: user ? "low" : "medium",
        ip: clientIp(request.headers),
        country: clientCountry(request.headers),
        userAgent: request.headers.get("user-agent"),
        method: request.method,
        path: pathname,
        userId: user?.id ?? null,
        detail: { authenticated: Boolean(user) },
      })
    );
  }

  // Protect /account — redirect unauthenticated users to login
  if (!user && pathname.startsWith("/account")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect already-authenticated users away from login/register/forgot-password
  if (user && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
