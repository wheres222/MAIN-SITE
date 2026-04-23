import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Maintenance mode ─────────────────────────────────────────────────────────
const MAINTENANCE_MODE  = true;                // ← flip to false to go live
const PREVIEW_SECRET    = "cp-preview-2025";   // ← ?preview=<this> grants access
const PREVIEW_COOKIE    = "cp_preview";
const MAINTENANCE_PATH  = "/maintenance";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
    // Grant preview access via ?preview=<secret> — set cookie + redirect clean
    if (searchParams.get("preview") === PREVIEW_SECRET) {
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

    // Maintenance gate: redirect everyone without the preview cookie
    if (MAINTENANCE_MODE && request.cookies.get(PREVIEW_COOKIE)?.value !== "1") {
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

  // Protect /account — redirect unauthenticated users to login
  if (!user && pathname.startsWith("/account")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect already-authenticated users away from login/register
  if (user && (pathname === "/login" || pathname === "/register")) {
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
