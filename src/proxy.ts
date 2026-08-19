import { createServerClient } from "@supabase/ssr";
import { NextResponse, after, type NextRequest } from "next/server";
import { detectThreats, isAdminPath } from "@/lib/security/detect";
import { isBlocked } from "@/lib/security/blocklist";
import {
  clientCountry,
  clientIp,
  linkAccountIp,
  recordDetections,
  recordSecurityEvent,
} from "@/lib/security/events";
import { canonicalGameSlug } from "@/lib/game-slug";

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

/**
 * Routes a blocked visitor can still reach. Mobile carriers and home broadband
 * put many people behind one address, so an IP block will eventually catch
 * someone innocent — leaving support reachable is the difference between a
 * customer who can tell you and one who silently leaves.
 */
function isAppealPath(pathname: string): boolean {
  return (
    pathname.startsWith("/support") ||
    pathname.startsWith("/contact-us") ||
    pathname.startsWith("/blocked") ||
    pathname.startsWith("/terms-of-service") ||
    pathname.startsWith("/privacy-policy")
  );
}

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

  const ip = clientIp(request.headers);

  if (threats.length > 0) {
    const context = {
      ip,
      country: clientCountry(request.headers),
      userAgent: request.headers.get("user-agent"),
      method: request.method,
      path: pathname,
      query: request.nextUrl.search.replace(/^\?/, ""),
    };
    after(() => recordDetections(threats, context));
  }

  // ── Blocklist ──────────────────────────────────────────────────────────────
  // Served from an in-memory snapshot, so this is a Set lookup rather than a
  // query. Support and policy pages stay reachable so a wrongly blocked
  // customer has a route back to you.
  if (!isAppealPath(pathname) && !pathname.startsWith("/_next/") && isBlocked(ip)) {
    after(() =>
      recordSecurityEvent({
        kind: "ip_blocked",
        severity: "low",
        ip,
        country: clientCountry(request.headers),
        userAgent: request.headers.get("user-agent"),
        method: request.method,
        path: pathname,
        statusCode: 403,
        detail: { enforced: true },
      })
    );

    return new NextResponse(
      `Access to this site has been blocked.\n\nIf you believe this is a mistake, contact support: ${request.nextUrl.origin}/support`,
      {
        status: 403,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          // Never let a block be cached by a CDN — unblocking must take effect
          // as soon as the snapshot refreshes.
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  }

  // ── Legacy /categories?slug=x → /categories/x ──────────────────────────────
  //
  // The page component tried to do this and never could: the route sets
  // revalidate = 300, and a query string is not part of an ISR cache key, so
  // every ?slug= request was served the cached /categories HTML and redirect()
  // never ran. Search Console filed those URLs under "alternative page with
  // proper canonical tag" pointing at /categories rather than at the landing
  // page they meant to reach.
  //
  // Done here rather than in next.config because a config redirect re-appends
  // the source query — producing /categories/rust?slug=rust, a fresh duplicate
  // of the URL we were consolidating. Here the query is dropped, and the slug
  // is canonicalised first so ?slug=r6 lands on rainbow-six-siege rather than
  // on an alias URL.
  if (pathname === "/categories") {
    const legacySlug = searchParams.get("slug");
    if (legacySlug) {
      const canonical = canonicalGameSlug(legacySlug);
      if (canonical) {
        const url = request.nextUrl.clone();
        url.pathname = `/categories/${canonical}`;
        url.search = "";
        return NextResponse.redirect(url, 308);
      }
    }
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

  // Record which addresses an account signs in from. One row per (account, ip)
  // pair, upserted, so this tracks distinct locations rather than traffic —
  // that is what makes multi-account abuse and shared-IP rings visible.
  if (user && ip) {
    after(() => linkAccountIp(user.id, ip));
  }

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
