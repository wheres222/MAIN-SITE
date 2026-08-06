import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { denyUnlessRole } from "@/lib/auth/guard";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET — fetch all categories + products + variants for the admin panel
export async function GET() {
  const denied = await denyUnlessRole("staff");
  if (denied) return denied;

  const db = createAdminClient();

  const [{ data: categories }, { data: products }, { data: variants }] =
    await Promise.all([
      db.from("shop_categories").select("*").order("name"),
      db.from("shop_products").select("*").order("name"),
      db.from("shop_variants").select("*").order("sort_order"),
    ]);

  return NextResponse.json({ categories: categories ?? [], products: products ?? [], variants: variants ?? [] });
}

// PATCH — update a single product or variant field
export async function PATCH(request: NextRequest) {
  const denied = await denyUnlessRole("staff");
  if (denied) return denied;

  const body = (await request.json()) as Record<string, unknown>;
  const { table, id, updates } = body;

  if (!table || !id || !updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = ["shop_products", "shop_variants", "shop_categories"];
  if (!allowed.includes(table as string)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db
    .from(table as string)
    .update({ ...(updates as object), updated_at: new Date().toISOString() })
    .eq("id", id as string);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a product (cascades to variants)
export async function DELETE(request: NextRequest) {
  const denied = await denyUnlessRole("staff");
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  const allowed = ["shop_products", "shop_variants", "shop_categories"];
  if (!table || !id || !allowed.includes(table)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
