import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type GenericRecord = Record<string, unknown>;

const SELLAUTH_BASE_URL =
  process.env.SELLAUTH_API_BASE_URL?.trim() || "https://api.sellauth.com";
const SELLAUTH_SHOP_ID = process.env.SELLAUTH_SHOP_ID?.trim() || "";
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY?.trim() || "";

function asRecord(value: unknown): GenericRecord {
  return typeof value === "object" && value !== null ? (value as GenericRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unwrapCollection(value: unknown, keys: string[]): unknown[] {
  const direct = asArray(value);
  if (direct.length > 0) return direct;

  const root = asRecord(value);
  for (const key of keys) {
    const byKey = asArray(root[key]);
    if (byKey.length > 0) return byKey;

    const nested = asRecord(root[key]);
    const nestedData = asArray(nested.data);
    if (nestedData.length > 0) return nestedData;
  }

  const data = asRecord(root.data);
  for (const key of keys) {
    const byKey = asArray(data[key]);
    if (byKey.length > 0) return byKey;
  }

  return [];
}

async function fetchSellAuth(path: string): Promise<unknown> {
  const response = await fetch(`${SELLAUTH_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${SELLAUTH_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = (await response.json()) as { error?: boolean; message?: string; data?: unknown };

  if (!response.ok || body.error) {
    throw new Error(body.message || `SellAuth request failed (${response.status})`);
  }

  return body.data ?? body;
}

function collectImageish(value: unknown, path = "root", out: Array<{ path: string; value: string }>, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return;

  if (typeof value === "string") {
    const low = path.toLowerCase();
    if (
      low.includes("image") ||
      low.includes("thumb") ||
      low.includes("banner") ||
      low.includes("icon") ||
      low.includes("avatar") ||
      low.includes("media") ||
      low.includes("file") ||
      low.includes("path") ||
      low.includes("url")
    ) {
      out.push({ path, value });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectImageish(entry, `${path}[${index}]`, out, depth + 1));
    return;
  }

  if (typeof value !== "object") return;

  const record = value as GenericRecord;
  for (const [key, entry] of Object.entries(record)) {
    collectImageish(entry, `${path}.${key}`, out, depth + 1);
  }
}

function summarizeRecord(raw: unknown) {
  const record = asRecord(raw);
  const imageish: Array<{ path: string; value: string }> = [];
  collectImageish(record, "item", imageish);

  return {
    id: record.id,
    name: record.name,
    keys: Object.keys(record).slice(0, 80),
    imageish: imageish.slice(0, 120),
  };
}

export async function GET() {
  if (!SELLAUTH_SHOP_ID || !SELLAUTH_API_KEY) {
    return NextResponse.json(
      { success: false, message: "SellAuth env is not configured." },
      { status: 500 }
    );
  }

  try {
    const [productsRaw, categoriesRaw, groupsRaw] = await Promise.all([
      fetchSellAuth(`/v1/shops/${SELLAUTH_SHOP_ID}/products`),
      fetchSellAuth(`/v1/shops/${SELLAUTH_SHOP_ID}/categories`),
      fetchSellAuth(`/v1/shops/${SELLAUTH_SHOP_ID}/groups`),
    ]);

    const products = unwrapCollection(productsRaw, ["products", "items", "data"]).map(summarizeRecord);
    const categories = unwrapCollection(categoriesRaw, ["categories", "items", "data"]).map(summarizeRecord);
    const groups = unwrapCollection(groupsRaw, ["groups", "items", "data"]).map(summarizeRecord);

    const focusProducts = products.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      return (
        name.includes("mail") ||
        name.includes("account") ||
        name.includes("nitro") ||
        name.includes("vpn")
      );
    });

    const focusCategories = categories.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      return name.includes("account") || name.includes("misc") || name.includes("vpn");
    });

    const focusGroups = groups.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      return name.includes("account") || name.includes("misc") || name.includes("vpn");
    });

    return NextResponse.json({
      success: true,
      totals: {
        products: products.length,
        categories: categories.length,
        groups: groups.length,
      },
      focus: {
        products: focusProducts,
        categories: focusCategories,
        groups: focusGroups,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to inspect SellAuth payloads.",
      },
      { status: 502 }
    );
  }
}
