import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessRole, getViewer, type Role } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["user", "staff", "owner"];

/** GET — user list with roles. Owner only: this exposes every account's email. */
export async function GET(request: NextRequest) {
  const denied = await denyUnlessRole("owner");
  if (denied) return denied;

  const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const db = createAdminClient();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, username, role, status, balance, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: "Query failed", detail: error.message },
      { status: 500 }
    );
  }

  // Emails live in auth.users, which is only reachable through the admin API.
  const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? null])
  );
  const lastSignInById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null])
  );

  let users = (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    role: p.role as Role,
    status: (p as { status?: string }).status ?? "active",
    balance: p.balance,
    createdAt: p.created_at,
    email: emailById.get(p.id) ?? null,
    lastSignInAt: lastSignInById.get(p.id) ?? null,
  }));

  if (search) {
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(search) ||
        u.username?.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ users });
}

/** PATCH — change a user's role. */
export async function PATCH(request: NextRequest) {
  const denied = await denyUnlessRole("owner");
  if (denied) return denied;

  const viewer = await getViewer();

  let body: { userId?: string; role?: string };
  try {
    body = (await request.json()) as { userId?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!role || !ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Changing your own role is the one way to lock yourself out of this page.
  if (userId === viewer.userId) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  const db = createAdminClient();

  // Refuse to remove the last owner — otherwise the admin surface becomes
  // unreachable for everyone and only a manual SQL edit can recover it.
  if (role !== "owner") {
    const { data: target } = await db
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (target?.role === "owner") {
      const { count } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last owner." },
          { status: 400 }
        );
      }
    }
  }

  const { error } = await db.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Update failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId, role });
}
