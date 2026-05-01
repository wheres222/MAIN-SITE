/**
 * Supabase session middleware.
 *
 * Must run on every request so the server-side Supabase client can
 * silently refresh the access token before it expires (default: 1 h).
 * Without this, users get logged out after an hour even though their
 * refresh token is still valid.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write incoming cookies to the *request* so Server Components
          // see the refreshed value in the same pass.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Rebuild response with updated cookies so the browser receives
          // the refreshed tokens.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Calling getUser() triggers a token refresh when the access token is
  // close to expiry. The result is intentionally ignored here — we only
  // care about the side-effect (refreshed cookie written to `response`).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next.js internals and static files. Run on all other routes,
     * including API routes (so server actions can read a valid session).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js)$).*)",
  ],
};
