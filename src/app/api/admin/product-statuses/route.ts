import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// ─── Auth ──────────────────────────────────────────────────────────────────
// Accepts either an admin session cookie OR an Authorization: Bearer <BOT_API_KEY> header.
async function checkAuth(request: NextRequest): Promise<boolean> {
  // Method 1: bot API key (used by the Discord bot)
  const botKey = process.env.BOT_API_KEY?.trim();
  if (botKey) {
    const authHeader = request.headers.get("Authorization") ?? "";
    if (authHeader === `Bearer ${botKey}`) return true;
  }

  // Method 2: admin session cookie
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() === adminEmail;
}

// ─── Discord outbound webhook ──────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; color: number; emoji: string }
> = {
  undetected: { label: "UNDETECTED", color: 0x2fe496, emoji: "🟢" },
  updating:   { label: "UPDATING",   color: 0x62abff, emoji: "🔵" },
  detected:   { label: "DETECTED",   color: 0xff8a9f, emoji: "🔴" },
};

async function fireDiscordWebhook(
  productName: string,
  status: string,
  note?: string | null,
  clearedBy?: string,
) {
  const webhookUrl = process.env.DISCORD_STATUS_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const cfg = STATUS_META[status];

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (cfg) {
    fields.push({ name: "Status", value: cfg.label, inline: true });
  }
  if (clearedBy) {
    fields.push({ name: "Action", value: "Reverted to auto-inferred", inline: true });
  }
  if (note) {
    fields.push({ name: "Note", value: note });
  }

  const embed = {
    title: cfg
      ? `${cfg.emoji} Status Update — ${productName}`
      : `⚪ Status Cleared — ${productName}`,
    color: cfg?.color ?? 0x8e98ab,
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: "CheatParadise Status Board" },
  };

  // Fire-and-forget — never block the response
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  }).catch(() => {});
}

// ─── POST — upsert a status override ──────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_id, product_name, status, note } = body;

  if (
    typeof product_id !== "string" ||
    typeof product_name !== "string" ||
    !["undetected", "updating", "detected"].includes(String(status))
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("product_statuses").upsert(
    {
      product_id,
      product_name,
      status,
      note: typeof note === "string" ? note : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify Discord (non-blocking)
  fireDiscordWebhook(
    String(product_name),
    String(status),
    typeof note === "string" ? note : null,
  );

  return NextResponse.json({ ok: true });
}

// ─── DELETE — remove override, revert to auto-inferred ────────────────────
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get("product_id");
  const product_name = searchParams.get("product_name") ?? product_id ?? "Unknown";

  if (!product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_statuses")
    .delete()
    .eq("product_id", product_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  fireDiscordWebhook(String(product_name), "cleared", null, "admin");

  return NextResponse.json({ ok: true });
}
