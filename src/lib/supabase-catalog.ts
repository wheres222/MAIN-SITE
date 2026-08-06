import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SellAuthCategory,
  SellAuthGroup,
  SellAuthProduct,
  StorefrontData,
} from "@/types/sellauth";

/**
 * Reads the self-hosted catalog (shop_categories / shop_products / shop_variants)
 * and shapes it like SellAuth's storefront payload, so every consumer downstream
 * stays unchanged.
 *
 * This used to live inside /api/storefront, which meant only client-side fetches
 * ever saw real products: server-rendered pages call getStorefrontData()
 * directly, that had no Supabase branch, so it fell through to the demo catalog.
 * Those pages then primed the shared client cache with demo data, and pages that
 * read the cache (notably /guide) rendered "<Category> Lite/Prime/Elite" instead
 * of real products. Keeping the mapping here lets both paths share one source of
 * truth.
 */

/**
 * SellAuth product IDs are numeric and the UI keys off them, so UUIDs have to be
 * projected into that space. Prefer the real sellauth_id when a row still
 * carries one, otherwise derive a stable number from the UUID.
 */
function numericId(sellauthId: string | null | undefined, uuid: string): number {
  if (sellauthId && /^\d+$/.test(String(sellauthId))) {
    return parseInt(String(sellauthId), 10);
  }
  return parseInt(uuid.replace(/-/g, "").slice(0, 8), 16) % 2_000_000;
}

/**
 * Returns null when the catalog can't be read or is empty — the caller decides
 * what to do next. An empty catalog must not be reported as success, or the
 * storefront renders as "no products" instead of falling back.
 */
export async function getSupabaseCatalog(): Promise<StorefrontData | null> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Service-role credentials missing — nothing to read.
    return null;
  }

  try {
    const [{ data: categories }, { data: products }, { data: variants }] =
      await Promise.all([
        admin
          .from("shop_categories")
          .select("id, sellauth_id, name, slug, image_url")
          .eq("active", true)
          .order("name"),
        admin
          .from("shop_products")
          .select("id, sellauth_id, category_id, name, description, image_url")
          .eq("active", true)
          .order("name"),
        admin
          .from("shop_variants")
          .select("id, sellauth_id, product_id, name, price, stock_available, sort_order")
          .eq("active", true)
          .order("sort_order"),
      ]);

    if (!categories || !products || !variants || products.length === 0) {
      return null;
    }

    const catById = new Map(categories.map((c) => [c.id as string, c]));
    const varsByProduct = new Map<string, typeof variants>();
    for (const variant of variants) {
      const productId = variant.product_id as string;
      const bucket = varsByProduct.get(productId);
      if (bucket) bucket.push(variant);
      else varsByProduct.set(productId, [variant]);
    }

    const mappedProducts: SellAuthProduct[] = products.map((p) => {
      const productUuid = p.id as string;
      const category = p.category_id ? catById.get(p.category_id as string) : null;
      const categoryNumId = category
        ? numericId(
            (category as { sellauth_id?: string | null }).sellauth_id,
            category.id as string
          )
        : null;

      const productVariants = (varsByProduct.get(productUuid) ?? []).map((v) => ({
        id: numericId(v.sellauth_id as string | null, v.id as string),
        name: v.name as string,
        price: Number(v.price),
        stock: (v.stock_available as boolean) ? 999 : 0,
        minQuantity: 1,
        isSynthetic: false,
      }));

      const prices = productVariants
        .map((v) => v.price)
        .filter((price) => price != null && Number.isFinite(price));

      return {
        id: numericId(p.sellauth_id as string | null, productUuid),
        name: p.name as string,
        description: (p.description as string) || "",
        image: (p.image_url as string) || "",
        images: p.image_url ? [p.image_url as string] : [],
        price: prices.length > 0 ? Math.min(...prices) : null,
        currency: "USD",
        stock: productVariants.reduce((acc, v) => acc + (v.stock ?? 0), 0),
        minQuantity: 1,
        groupId: categoryNumId,
        groupName: category ? (category.name as string) : "",
        categoryId: categoryNumId,
        categoryName: category ? (category.name as string) : "",
        variants: productVariants,
        tabs: [],
      } satisfies SellAuthProduct;
    });

    const asGroup = (c: (typeof categories)[number]) => ({
      id: numericId((c as { sellauth_id?: string | null }).sellauth_id, c.id as string),
      name: c.name as string,
      description: "",
      image: c.image_url ? { url: c.image_url as string } : null,
    });

    const groups: SellAuthGroup[] = categories.map(asGroup);
    const mappedCategories: SellAuthCategory[] = categories.map(asGroup);

    return {
      success: true,
      provider: "supabase",
      message: "Loaded from Supabase catalog.",
      products: mappedProducts,
      groups,
      categories: mappedCategories,
      paymentMethods: [{ id: "crypto", name: "Cryptocurrency", enabled: true }],
      warnings: [],
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
