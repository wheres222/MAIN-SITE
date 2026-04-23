import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_MODE = true; // ← set to false to take the site out of maintenance
const PREVIEW_SECRET   = "cp-preview-2025";   // ← change this to your own secret
const COOKIE_NAME      = "cp_preview";
const MAINTENANCE_PATH = "/maintenance";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Always allow the maintenance page and its assets through
  if (
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/branding/") ||
    pathname.startsWith("/fonts/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|webp|svg|gif|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Grant preview access via ?preview=<secret> — sets a cookie and redirects clean
  if (searchParams.get("preview") === PREVIEW_SECRET) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE_NAME, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  }

  // If maintenance mode is off, let everyone through
  if (!MAINTENANCE_MODE) return NextResponse.next();

  // If the visitor has the preview cookie, let them through
  if (req.cookies.get(COOKIE_NAME)?.value === "1") {
    return NextResponse.next();
  }

  // Everyone else → maintenance page
  const url = req.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
