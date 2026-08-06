import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientCountry, clientIp, recordSecurityEvent } from "@/lib/security/events";

export type Role = "user" | "staff" | "owner";

/** Ranked so a check is a comparison rather than a set membership test. */
const RANK: Record<Role, number> = { user: 0, staff: 1, owner: 2 };

export interface Viewer {
  userId: string | null;
  email: string | null;
  role: Role;
}

const ANONYMOUS: Viewer = { userId: null, email: null, role: "user" };

/**
 * Resolve the current session's role.
 *
 * profiles.role is the source of truth. ADMIN_EMAIL is kept as a bootstrap
 * fallback only: on a fresh database no row has role='owner' yet, and without
 * the fallback there would be no way to reach the admin UI to grant yourself
 * the role in the first place. Once your profile row says 'owner' the env var
 * stops mattering — remove it whenever you like.
 */
export async function getViewer(): Promise<Viewer> {
  // Fail closed. createServerClient throws outright when the Supabase env vars
  // are missing, and getUser() can fail on a network blip — in either case the
  // only safe answer to "who is this?" is "nobody", which denies access. An
  // uncaught throw here would instead surface as a 500 from an API route, and a
  // caller that treats errors leniently could turn that into an open door.
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return ANONYMOUS;
  }

  let user: { id: string; email?: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return ANONYMOUS;
  }

  if (!user) return ANONYMOUS;

  const email = user.email?.toLowerCase() ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const stored = profile?.role as Role | undefined;
  if (stored && stored in RANK) {
    return { userId: user.id, email, role: stored };
  }

  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role: Role = bootstrapEmail && email === bootstrapEmail ? "owner" : "user";

  return { userId: user.id, email, role };
}

export async function getViewerRole(): Promise<Role> {
  return (await getViewer()).role;
}

export function hasRole(viewer: Viewer, minimum: Role): boolean {
  return RANK[viewer.role] >= RANK[minimum];
}

/**
 * Page guard. Redirects rather than rendering an error, matching how the
 * existing admin pages and the /account route in src/proxy.ts behave.
 *
 * Anonymous visitors go to /login so they can come back; a signed-in user who
 * simply lacks the role goes to / — bouncing them to a login form they are
 * already past would be a dead end.
 */
export async function requireRole(minimum: Role): Promise<Viewer> {
  const viewer = await getViewer();

  if (!viewer.userId) redirect("/login?next=/admin");

  if (!hasRole(viewer, minimum)) {
    await recordDenial(viewer, minimum);
    redirect("/");
  }

  return viewer;
}

/**
 * A signed-in account reaching for privilege it doesn't have is worth knowing
 * about — it's either a staff member hitting an owner-only page, or a
 * compromised session being explored.
 */
async function recordDenial(viewer: Viewer, required: Role): Promise<void> {
  try {
    const h = await headers();
    after(() =>
      recordSecurityEvent({
        kind: "admin_denied",
        severity: "medium",
        ip: clientIp(h),
        country: clientCountry(h),
        userAgent: h.get("user-agent"),
        path: h.get("x-invoke-path") ?? h.get("referer"),
        userId: viewer.userId,
        detail: { required, actual: viewer.role, email: viewer.email },
      })
    );
  } catch {
    // headers() outside a request scope, or after() unavailable — never let
    // telemetry stop the redirect from happening.
  }
}

/**
 * API guard. Returns a NextResponse to send back, or null when the caller is
 * allowed through.
 *
 *   const denied = await denyUnlessRole("owner");
 *   if (denied) return denied;
 *
 * 404 rather than 403 for insufficient privilege: a 403 confirms the endpoint
 * exists, which is free reconnaissance for anyone probing for admin surface.
 */
export async function denyUnlessRole(
  minimum: Role
): Promise<NextResponse | null> {
  const viewer = await getViewer();

  if (!viewer.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasRole(viewer, minimum)) {
    await recordDenial(viewer, minimum);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
