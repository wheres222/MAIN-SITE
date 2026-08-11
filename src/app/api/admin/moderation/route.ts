import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessRole, getViewer } from "@/lib/auth/guard";
import { invalidateBlocklist } from "@/lib/security/blocklist";
import { clientIp, recordSecurityEvent } from "@/lib/security/events";

export const dynamic = "force-dynamic";

/**
 * Owner-only moderation: block/unblock an address, and set an account's status.
 *
 * Every action writes a security_event of its own. Moderation is exactly the
 * kind of thing that needs to be reviewable months later — "why is this
 * customer banned" should have an answer that isn't someone's memory.
 */

const ACCOUNT_STATUSES = new Set(["active", "suspended", "banned"]);

/** GET — current blocklist, plus which accounts have been seen from each IP. */
export async function GET(request: NextRequest) {
  const denied = await denyUnlessRole("owner");
  if (denied) return denied;

  const db = createAdminClient();
  const lookupIp = request.nextUrl.searchParams.get("ip")?.trim();

  const { data: blocks } = await db
    .from("security_blocklist")
    .select("id, ip, reason, created_at, expires_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Accounts seen from a specific address — the answer to "who is behind this".
  let accountsForIp: { user_id: string; email: string | null; hits: number; last_seen: string }[] = [];
  if (lookupIp) {
    const { data: rows } = await db
      .from("account_ip_log")
      .select("user_id, hits, last_seen")
      .eq("ip", lookupIp)
      .order("last_seen", { ascending: false })
      .limit(50);

    if (rows?.length) {
      const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? null]));
      accountsForIp = rows.map((r) => ({
        user_id: r.user_id as string,
        email: emailById.get(r.user_id as string) ?? null,
        hits: r.hits as number,
        last_seen: r.last_seen as string,
      }));
    }
  }

  return NextResponse.json({ blocks: blocks ?? [], accountsForIp });
}

/** POST — block an IP, or change an account's moderation status. */
export async function POST(request: NextRequest) {
  const denied = await denyUnlessRole("owner");
  if (denied) return denied;

  const viewer = await getViewer();
  const db = createAdminClient();

  let body: {
    action?: string;
    ip?: string;
    reason?: string;
    expiresInDays?: number;
    userId?: string;
    status?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;

  // ── Block an address ───────────────────────────────────────────────────────
  if (action === "block-ip") {
    const ip = body.ip?.trim();
    if (!ip) return NextResponse.json({ error: "ip is required" }, { status: 400 });

    // Blocking the address you are currently using would lock you out of the
    // page you would need to undo it from.
    if (ip === clientIp(request.headers)) {
      return NextResponse.json(
        { error: "That is your own current IP address — blocking it would lock you out." },
        { status: 400 }
      );
    }

    const expiresAt =
      typeof body.expiresInDays === "number" && body.expiresInDays > 0
        ? new Date(Date.now() + body.expiresInDays * 86_400_000).toISOString()
        : null;

    const { error } = await db.from("security_blocklist").upsert(
      {
        ip,
        reason: body.reason?.slice(0, 500) ?? null,
        created_by: viewer.userId,
        expires_at: expiresAt,
      },
      { onConflict: "ip" }
    );

    if (error) {
      return NextResponse.json({ error: "Block failed", detail: error.message }, { status: 500 });
    }

    invalidateBlocklist();
    await recordSecurityEvent({
      kind: "account_moderated",
      severity: "medium",
      ip,
      userId: viewer.userId,
      detail: { action: "block-ip", reason: body.reason ?? null, expiresAt, by: viewer.email },
    });

    return NextResponse.json({ ok: true, ip, expiresAt });
  }

  // ── Unblock ────────────────────────────────────────────────────────────────
  if (action === "unblock-ip") {
    const ip = body.ip?.trim();
    if (!ip) return NextResponse.json({ error: "ip is required" }, { status: 400 });

    const { error } = await db.from("security_blocklist").delete().eq("ip", ip);
    if (error) {
      return NextResponse.json({ error: "Unblock failed", detail: error.message }, { status: 500 });
    }

    invalidateBlocklist();
    await recordSecurityEvent({
      kind: "account_moderated",
      severity: "low",
      ip,
      userId: viewer.userId,
      detail: { action: "unblock-ip", by: viewer.email },
    });

    return NextResponse.json({ ok: true, ip });
  }

  // ── Account status ─────────────────────────────────────────────────────────
  if (action === "set-status") {
    const { userId, status } = body;
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!status || !ACCOUNT_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${[...ACCOUNT_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }
    if (userId === viewer.userId) {
      return NextResponse.json(
        { error: "You cannot change your own account status." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("profiles")
      .update({
        status,
        moderation_note: body.note?.slice(0, 1000) ?? null,
        moderated_at: new Date().toISOString(),
        moderated_by: viewer.userId,
      })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "Update failed", detail: error.message }, { status: 500 });
    }

    // A banned account keeps a valid session cookie until it expires, so revoke
    // it — otherwise the ban only takes effect at their next sign-in.
    if (status === "banned") {
      try {
        await db.auth.admin.signOut(userId, "global");
      } catch {
        // Best effort; the guard refuses them on the next request regardless.
      }
    }

    await recordSecurityEvent({
      kind: "account_moderated",
      severity: status === "banned" ? "medium" : "low",
      userId,
      detail: { action: "set-status", status, note: body.note ?? null, by: viewer.email },
    });

    return NextResponse.json({ ok: true, userId, status });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
