import { NextResponse } from "next/server";
import { getStorefrontData, isSellAuthConfigured } from "@/lib/sellauth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StorefrontData, SellAuthProduct, SellAuthGroup, SellAuthCategory } from "@/types/sellauth";

// Revalidate at the same cadence as the edge cache
export const revalidate = 300;

export async function GET() {
  // ── SellAuth path (when configured) ────────────────────────────────────────
  if (isSellAuthConfigured()) {
    const data = await getStorefrontData();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // ── Supabase catalog fallback ───────────────────────────────────────────────
  try {
    const admin = createAdminClient();

    const [
      { data: categories },
      { data: products },
      { data: variants },
    ] = await Promise.all([
      admin.from("shop_categories").select("id, sellauth_id, name, slug, image_url").eq("active", true).order("name"),
      admin.from("shop_products").select("id, sellauth_id, category_id, name, description, image_url").eq("active", true).order("name"),
      admin.from("shop_variants").select("id, sellauth_id, product_id, name, price, stock_available, sort_order").eq("active", true).order("sort_order"),
    ]);

    if (categories && products && variants) {
      // Build maps for fast lookup
      const catById  = new Map((categories).map((c) => [c.id as string, c]));
      const varsByProd = new Map<string, typeof variants>();
      for (const v of variants) {
        const pid = v.product_id as string;
        if (!varsByProd.has(pid)) varsByProd.set(pid, []);
        varsByProd.get(pid)!.push(v);
      }

      // Stable numeric ID from sellauth_id string, else from UUID hash
      function numericId(sellauth_id: string | null | undefined, uuid: string): number {
        if (sellauth_id && /^\d+$/.test(String(sellauth_id))) {
          return parseInt(String(sellauth_id), 10);
        }
        // Deterministic hash from first 8 hex chars of UUID
        return parseInt(uuid.replace(/-/g, "").slice(0, 8), 16) % 2_000_000;
      }

      const sellAuthProducts: SellAuthProduct[] = products.map((p) => {
        const pid         = p.id as string;
        const productNumId = numericId(p.sellauth_id as string | null, pid);
        const cat          = p.category_id ? catById.get(p.category_id as string) : null;
        const pvariants    = varsByProd.get(pid) ?? [];

        const variantObjects = pvariants.map((v) => ({
          id:          numericId(v.sellauth_id as string | null, v.id as string),
          name:        v.name as string,
          price:       Number(v.price),
          stock:       (v.stock_available as boolean) ? 999 : 0,
          minQuantity: 1,
          isSynthetic: false,
        }));

        const minPrice = variantObjects.length > 0
          ? Math.min(...variantObjects.map((v) => v.price).filter((x) => x != null))
          : null;

        return {
          id:           productNumId,
          name:         p.name as string,
          description:  (p.description as string) || "",
          image:        (p.image_url as string) || "",
          images:       p.image_url ? [p.image_url as string] : [],
          price:        minPrice,
          currency:     "USD",
          stock:        variantObjects.reduce((acc, v) => acc + (v.stock ?? 0), 0),
          minQuantity:  1,
          groupId:      cat ? numericId((cat as { sellauth_id?: string | null }).sellauth_id, cat.id as string) : null,
          groupName:    cat ? (cat.name as string) : "",
          categoryId:   cat ? numericId((cat as { sellauth_id?: string | null }).sellauth_id, cat.id as string) : null,
          categoryName: cat ? (cat.name as string) : "",
          variants:     variantObjects,
          tabs:         [],
        } satisfies SellAuthProduct;
      });

      const groups: SellAuthGroup[] = categories.map((c) => ({
        id:          numericId((c as { sellauth_id?: string | null }).sellauth_id, c.id as string),
        name:        c.name as string,
        description: "",
        image:       c.image_url ? { url: c.image_url as string } : null,
      }));

      const sellAuthCategories: SellAuthCategory[] = categories.map((c) => ({
        id:          numericId((c as { sellauth_id?: string | null }).sellauth_id, c.id as string),
        name:        c.name as string,
        description: "",
        image:       c.image_url ? { url: c.image_url as string } : null,
      }));

      const payload: StorefrontData = {
        success:        true,
        provider:       "mock",
        message:        "Loaded from Supabase catalog.",
        products:       sellAuthProducts,
        groups,
        categories:     sellAuthCategories,
        paymentMethods: [{ id: "crypto", name: "Cryptocurrency", enabled: true }],
        warnings:       [],
        fetchedAt:      new Date().toISOString(),
      };

      return NextResponse.json(payload, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" },
      });
    }
  } catch {
    // Fall through to original getStorefrontData (returns mock)
  }

  // Last resort: original mock data
  const data = await getStorefrontData();
  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" },
  });
}
