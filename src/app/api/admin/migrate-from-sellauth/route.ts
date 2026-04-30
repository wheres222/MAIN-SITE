import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStorefrontData } from "@/lib/sellauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function checkAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() === adminEmail;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();

  // Pull everything from SellAuth in one shot
  let storefront;
  try {
    storefront = await getStorefrontData();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch SellAuth data: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const stats = { categories: 0, products: 0, variants: 0, errors: [] as string[] };

  // ── 1. Categories (from SellAuth groups) ────────────────────────────────────
  const sellAuthIdToCategoryId = new Map<number, string>();

  for (const group of storefront.groups) {
    const slug = toSlug(group.name) || `group-${group.id}`;
    const imageUrl = group.image?.url || null;

    const { data, error } = await db
      .from("shop_categories")
      .upsert(
        { sellauth_id: String(group.id), name: group.name, slug, image_url: imageUrl },
        { onConflict: "sellauth_id" }
      )
      .select("id")
      .single();

    if (error) {
      stats.errors.push(`Category "${group.name}": ${error.message}`);
    } else if (data) {
      sellAuthIdToCategoryId.set(group.id, data.id as string);
      stats.categories++;
    }
  }

  // ── 2. Products + Variants ───────────────────────────────────────────────────
  for (const product of storefront.products) {
    const categoryId = product.groupId
      ? (sellAuthIdToCategoryId.get(product.groupId) ?? null)
      : null;

    // If category wasn't found above, look it up from DB
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && product.groupId) {
      const { data } = await db
        .from("shop_categories")
        .select("id")
        .eq("sellauth_id", String(product.groupId))
        .single();
      resolvedCategoryId = data?.id ?? null;
    }

    const { data: inserted, error: productError } = await db
      .from("shop_products")
      .upsert(
        {
          sellauth_id: String(product.id),
          category_id: resolvedCategoryId,
          name: product.name,
          description: product.description || null,
          image_url: typeof product.image === "string" && product.image ? product.image : null,
        },
        { onConflict: "sellauth_id" }
      )
      .select("id")
      .single();

    if (productError || !inserted) {
      stats.errors.push(`Product "${product.name}": ${productError?.message ?? "no id returned"}`);
      continue;
    }

    stats.products++;

    // Variants
    let variantOrder = 0;
    for (const variant of product.variants) {
      if (variant.price === null) continue;

      const { error: varError } = await db
        .from("shop_variants")
        .upsert(
          {
            sellauth_id: String(variant.id),
            product_id: inserted.id,
            name: variant.name,
            price: variant.price,
            sort_order: variantOrder++,
          },
          { onConflict: "sellauth_id" }
        );

      if (varError) {
        stats.errors.push(`Variant "${variant.name}" of "${product.name}": ${varError.message}`);
      } else {
        stats.variants++;
      }
    }
  }

  return NextResponse.json({ ok: true, stats });
}
