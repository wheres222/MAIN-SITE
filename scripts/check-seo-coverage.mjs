#!/usr/bin/env node
/**
 * Reconcile per-product SEO content against the live catalogue.
 *
 * Written after an entry was keyed "rainbow-six-siege/crusader-full" while the
 * catalogue produced "rainbow-six-siege/crusader". Lookup is an exact key
 * match, so the entry existed, typechecked, shipped, and could never load —
 * nothing in the build had any way to notice.
 *
 * The live sitemap is the source of truth for product URLs, since the
 * catalogue itself lives in Supabase rather than in this repo.
 *
 *   node scripts/check-seo-coverage.mjs
 *   node scripts/check-seo-coverage.mjs https://staging.example.com
 *
 * Exits non-zero if a content key matches no product. A product with no
 * content is reported but not fatal — coverage is expected to lag the
 * catalogue, whereas a key matching nothing is always a mistake.
 */

import { readFileSync } from "node:fs";

const SITE = process.argv[2] ?? "https://cheatparadise.com";

/**
 * Deliberately excluded.
 *
 * misc/donation was never a product anyone searches for. The three accounts
 * entries are hidden from the site via src/lib/hidden-products.ts — their
 * content is kept rather than deleted so un-hiding restores the page intact,
 * but a hidden product is absent from the sitemap, and this check compares
 * against the sitemap.
 */
const IGNORED = new Set([
  "misc/donation",
  "accounts/mails",
  "accounts/ip-vanish-account",
  "accounts/cyberghost-account",
]);

function keysFromSource() {
  const source = readFileSync("src/lib/product-seo-content.ts", "utf8");
  return new Set(
    [...source.matchAll(/^\s+key: "([^"]+)"/gm)].map((m) => m[1].toLowerCase())
  );
}

async function keysFromSitemap() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const matches = xml.matchAll(/\/products\/([a-z0-9-]+)\/([a-z0-9-]+)/g);
  return new Set([...matches].map((m) => `${m[1]}/${m[2]}`));
}

const [content, live] = await Promise.all([
  Promise.resolve(keysFromSource()),
  keysFromSitemap(),
]);

// IGNORED applies here too: a hidden product keeps its content but leaves the
// sitemap, so its key would look orphaned every run.
const orphanedKeys = [...content].filter((k) => !live.has(k) && !IGNORED.has(k));
const missingContent = [...live].filter(
  (k) => !content.has(k) && !IGNORED.has(k)
);

console.log(`content entries: ${content.size}`);
console.log(`live products:   ${live.size}`);

if (missingContent.length) {
  console.log(`\nproducts with no content (${missingContent.length}):`);
  for (const key of missingContent.sort()) console.log(`  ${key}`);
}

if (orphanedKeys.length) {
  console.error(`\nERROR — keys matching no product (${orphanedKeys.length}):`);
  for (const key of orphanedKeys.sort()) console.error(`  ${key}`);
  console.error("\nThese entries can never render. Fix the key or remove them.");
  process.exit(1);
}

console.log("\nEvery content key matches a live product.");
