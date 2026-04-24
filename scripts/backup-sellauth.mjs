/**
 * SellAuth full backup script.
 * Run: node scripts/backup-sellauth.mjs
 * Reads SELLAUTH_SHOP_ID and SELLAUTH_API_KEY from .env.local
 * Saves all products, variants, groups, categories, and payment methods to backup/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env.local not found at", envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= val;
  }
}

loadEnv();

// Also accept --shop-id=X --api-key=Y as CLI args for quick one-shot use
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => { const [k, ...v] = a.slice(2).split("="); return [k, v.join("=")]; })
);

const SHOP_ID = args["shop-id"] || process.env.SELLAUTH_SHOP_ID?.trim();
const API_KEY = args["api-key"] || process.env.SELLAUTH_API_KEY?.trim();
const BASE_URL = process.env.SELLAUTH_API_BASE_URL?.trim() || "https://api.sellauth.com";

if (!SHOP_ID || !API_KEY) {
  console.error("❌  Provide credentials via .env.local OR as CLI args:");
  console.error("    node scripts/backup-sellauth.mjs --shop-id=YOUR_ID --api-key=YOUR_KEY");
  process.exit(1);
}

async function sellAuthFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return res.json();
}

async function fetchAllPages(endpoint, keys) {
  const results = [];
  const seen = new Set();
  for (let page = 1; page <= 50; page++) {
    const url = `${endpoint}?page=${page}&perPage=100&per_page=100`;
    let body;
    try {
      body = await sellAuthFetch(url);
    } catch (e) {
      if (page === 1) throw e;
      break;
    }

    // Unwrap envelope
    let items = [];
    const data = body?.data ?? body;
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === "object") {
      for (const key of keys) {
        const candidate = data[key];
        if (Array.isArray(candidate) && candidate.length > 0) { items = candidate; break; }
        if (candidate?.data && Array.isArray(candidate.data)) { items = candidate.data; break; }
      }
    }

    if (items.length === 0) break;

    // Dedup by id or name
    const sig = items.slice(0, 3).map(i => i?.id ?? i?.name ?? JSON.stringify(i)).join("|");
    if (seen.has(sig)) break;
    seen.add(sig);

    results.push(...items);
    if (items.length < 100) break;
  }
  return results;
}

async function main() {
  const outDir = path.join(ROOT, "backup");
  fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(outDir, `sellauth-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`\n🔄  Backing up SellAuth shop ${SHOP_ID} → ${backupDir}\n`);

  const save = (name, data) => {
    const file = path.join(backupDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`  ✅  ${name}.json  (${Array.isArray(data) ? data.length + " records" : "saved"})`);
  };

  // Products
  try {
    const products = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/products`,
      ["products", "items", "data"]
    );
    save("products", products);
  } catch (e) {
    console.error("  ❌  products:", e.message);
  }

  // Groups
  try {
    const groups = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/groups`,
      ["groups", "items", "data"]
    );
    save("groups", groups);
  } catch (e) {
    console.error("  ❌  groups:", e.message);
  }

  // Categories
  try {
    const categories = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/categories`,
      ["categories", "items", "data"]
    );
    save("categories", categories);
  } catch (e) {
    console.error("  ❌  categories:", e.message);
  }

  // Payment methods
  try {
    const methods = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/payment-methods`,
      ["payment_methods", "paymentMethods", "methods", "items", "data"]
    );
    save("payment-methods", methods);
  } catch (e) {
    console.error("  ❌  payment-methods:", e.message);
  }

  // Shop info
  try {
    const shop = await sellAuthFetch(`/v1/shops/${SHOP_ID}`);
    save("shop-info", shop);
  } catch (e) {
    console.error("  ❌  shop-info:", e.message);
  }

  // Orders (last 500)
  try {
    const orders = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/orders`,
      ["orders", "items", "data"]
    );
    save("orders", orders);
  } catch (e) {
    console.warn("  ⚠️   orders (may require elevated permissions):", e.message);
  }

  // Coupons
  try {
    const coupons = await fetchAllPages(
      `/v1/shops/${SHOP_ID}/coupons`,
      ["coupons", "items", "data"]
    );
    save("coupons", coupons);
  } catch (e) {
    console.warn("  ⚠️   coupons:", e.message);
  }

  console.log(`\n✅  Backup complete → ${backupDir}\n`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
