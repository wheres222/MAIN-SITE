/**
 * Products that stay in SellAuth but are not shown on the site.
 *
 * Useful for pulling a product from sale without deleting it upstream — the
 * listing, its category tile count and its guide entry all disappear together,
 * and removing the name here brings it straight back.
 *
 * Matched on the product name, case-insensitively, with runs of whitespace and
 * surrounding punctuation normalised so "Krush  Arc Raiders" and
 * "Krush - Arc Raiders" both match.
 */
const HIDDEN_PRODUCT_NAMES = [
  "Krush Arc Raiders",
];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const HIDDEN = new Set(HIDDEN_PRODUCT_NAMES.map(normalize));

export function isHiddenProduct(name: string): boolean {
  return HIDDEN.has(normalize(name || ""));
}

/** Drop every hidden product from a storefront product list. */
export function withoutHiddenProducts<T extends { name: string }>(products: T[]): T[] {
  if (HIDDEN.size === 0) return products;
  return products.filter((product) => !isHiddenProduct(product.name));
}
