/**
 * External status push API
 *
 * PUT /api/status/:ref
 * Authorization: Bearer <STATUS_API_KEY>
 * Content-Type: application/json
 *
 * Body: { "status": "undetected" | "updating" | "detected", "message": "optional note" }
 *
 * The :ref can be any slug or identifier you use in your monitoring bot
 * (e.g. "rust", "valorant-cheat", "cs2-external").
 * It maps 1:1 to product_id in the product_statuses table.
 *
 * Set STATUS_API_KEY in your .env.local to enable this endpoint.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["undetected", "updating", "detected"]);

const STATUS_META: Record<string, { label: string; color: number; emoji: string }> = {
  undetected: { label: "UNDETECTED", color: 0x2fe496, emoji: "🟢" },
  updating:   { label: "UPDATING",   color: 0x62abff, emoji: "🔵" },
  detected:   { label: "DETECTED",   color: 0xff8a9f, emoji: "🔴" },
};

function checkApiKey(request: NextRequest): boolean {
  const apiKey = process.env.STATUS_API_KEY?.trim();
  if (!apiKey) return false;
  const authHeader = request.headers.get("Authorization") ?? "";
  return authHeader === `Bearer ${apiKey}`;
}

async function fireDiscordWebhook(ref: string, status: string, message?: string) {
  const webhookUrl = process.env.DISCORD_STATUS_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  const cfg = STATUS_META[status];
  if (!cfg) return;

  const embed = {
    title: `${cfg.emoji} Status Update — ${ref}`,
    color: cfg.color,
    fields: [
      { name: "Status", value: cfg.label, inline: true },
      { name: "Ref", value: ref, inline: true },
      ...(message ? [{ name: "Note", value: message }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "CheatParadise Status Board" },
  };

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  }).catch(() => {});
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ref } = await params;
  if (!ref || !ref.trim()) {
    return NextResponse.json({ error: "ref is required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, message } = body;

  if (!status || !VALID_STATUSES.has(String(status))) {
    return NextResponse.json(
      { error: `status must be one of: ${[...VALID_STATUSES].join(", ")}` },
      { status: 400 }
    );
  }

  const productId = ref.trim().toLowerCase();
  const note = typeof message === "string" ? message.slice(0, 500) : null;

  const supabase = createAdminClient();
  const { error: dbError } = await supabase.from("product_statuses").upsert(
    {
      product_id: productId,
      product_name: productId,
      status: String(status),
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  fireDiscordWebhook(productId, String(status), note ?? undefined);

  return NextResponse.json({ ok: true, ref: productId, status });
}

// GET — read the current status of a single ref
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_statuses")
    .select("product_id, product_name, status, note, updated_at")
    .eq("product_id", ref.trim().toLowerCase())
    .single();

  if (error) {
    return NextResponse.json({ status: "undetected", ref }, { status: 200 });
  }

  return NextResponse.json(data);
}

// DELETE — clear override, revert to auto-inferred
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ref } = await params;
  const supabase = createAdminClient();
  await supabase
    .from("product_statuses")
    .delete()
    .eq("product_id", ref.trim().toLowerCase());

  return NextResponse.json({ ok: true, ref });
}
