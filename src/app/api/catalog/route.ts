import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Edge-cache for 5 minutes; stale-while-revalidate for another 5
export const revalidate = 300;

/**
 * GET /api/catalog
 *
 * Returns all active categories, products and variants from our own Supabase
 * tables (replaces the SellAuth storefront endpoint).  No auth required —
 * this is the public product listing.
 *
 * Response is edge-cached so the DB is hit at most once per 5 minutes
 * across all Vercel edge nodes.
 */
export async function GET() {
  const admin = createAdminClient();

  const [
    { data: categories, error: catErr },
    { data: products,   error: prodErr },
    { data: variants,   error: varErr  },
  ] = await Promise.all([
    admin
      .from("shop_categories")
      .select("id, name, slug, image_url, is_active:active")
      .eq("active", true)
      .order("name"),
    admin
      .from("shop_products")
      .select("id, category_id, name, description, image_url, is_active:active")
      .eq("active", true)
      .order("name"),
    admin
      .from("shop_variants")
      .select("id, product_id, name, price, stock_available, sort_order, is_active:active")
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (catErr || prodErr || varErr) {
    console.error("[catalog] DB error", { catErr, prodErr, varErr });
    return NextResponse.json(
      { error: "Failed to load catalog" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      categories: categories ?? [],
      products:   products   ?? [],
      variants:   variants   ?? [],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
