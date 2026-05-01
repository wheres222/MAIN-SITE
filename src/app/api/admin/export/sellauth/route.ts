import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStorefrontData } from "@/lib/sellauth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function checkAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() === adminEmail;
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  // Wrap in quotes if it contains comma, newline, or double-quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/export/sellauth?format=json|csv
 *
 * Exports all SellAuth products (fully enriched — descriptions, images,
 * variants, pricing) as a downloadable file.
 *
 * format=json  →  Structured JSON array, one object per variant row
 * format=csv   →  Flat CSV, one row per variant (importable into spreadsheets)
 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") {
    return NextResponse.json({ error: "format must be json or csv" }, { status: 400 });
  }

  // Fetch all data — bypasses in-memory cache by relying on getStorefrontData
  // which pulls fresh or edge-cached data. For a truly fresh pull add ?bust=1.
  let storefront;
  try {
    storefront = await getStorefrontData();
  } catch (err) {
    return NextResponse.json(
      { error: `SellAuth fetch failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const { products, groups } = storefront;

  // Build group ID → name lookup
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

  // ── JSON export ─────────────────────────────────────────────────────────────
  if (format === "json") {
    const exported = products.map((product) => ({
      sellauth_product_id: product.id,
      name:                product.name,
      description:         product.description || "",
      image_url:           product.image && !product.image.startsWith("/") ? product.image : "",
      all_image_urls:      (product.images ?? []).filter((u) => !u.startsWith("/")),
      category:            product.groupName || product.categoryName || groupNameById.get(product.groupId ?? 0) || "",
      sellauth_group_id:   product.groupId,
      sellauth_category_id: product.categoryId,
      base_price_usd:      product.price,
      currency:            product.currency || "USD",
      stock:               product.stock,
      tabs:                (product.tabs ?? []).map((tab) => ({
        title: tab.title,
        items: tab.items,
      })),
      variants:            product.variants.map((v) => ({
        sellauth_variant_id: v.id,
        name:                v.name,
        price_usd:           v.price,
        stock:               v.stock,
      })),
    }));

    const json = JSON.stringify({ exported_at: new Date().toISOString(), count: exported.length, products: exported }, null, 2);

    return new Response(json, {
      headers: {
        "Content-Type":        "application/json",
        "Content-Disposition": `attachment; filename="sellauth-export-${Date.now()}.json"`,
      },
    });
  }

  // ── CSV export ──────────────────────────────────────────────────────────────
  // One row per variant (products with multiple variants produce multiple rows)
  const headers = [
    "Product Name",
    "Variant Name",
    "Price (USD)",
    "Category / Group",
    "Description",
    "Image URL",
    "Stock",
    "SellAuth Product ID",
    "SellAuth Variant ID",
    "Features / Tabs",
  ];

  const rows: string[] = [toCsvRow(headers)];

  for (const product of products) {
    const category = product.groupName || product.categoryName || groupNameById.get(product.groupId ?? 0) || "";
    const imageUrl  = product.image && !product.image.startsWith("/") ? product.image : "";
    const features  = (product.tabs ?? [])
      .flatMap((tab) => tab.items)
      .join(" | ");

    if (product.variants.length === 0) {
      // Product with no variants — one row
      rows.push(toCsvRow([
        product.name,
        "",
        product.price ?? "",
        category,
        product.description || "",
        imageUrl,
        product.stock ?? "",
        product.id,
        "",
        features,
      ]));
    } else {
      for (const variant of product.variants) {
        rows.push(toCsvRow([
          product.name,
          variant.name,
          variant.price ?? product.price ?? "",
          category,
          product.description || "",
          imageUrl,
          variant.stock ?? product.stock ?? "",
          product.id,
          variant.id,
          features,
        ]));
      }
    }
  }

  const csv = rows.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sellauth-export-${Date.now()}.csv"`,
    },
  });
}
