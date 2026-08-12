import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";

/**
 * Product URLs carry the game as well as the product name:
 *
 *   /products/arc-raiders/ancient
 *
 * The old shape was /products/{product-name} only. Two problems with that.
 * Every competitor ranking for a product term ("crusader r6", "ancient arc
 * raiders") puts product *and* game in the URL, title and H1 — a page named
 * only "ancient" has nothing to match the game half of the query. And when the
 * catalogue holds one product per game under a shared name — an "Ancient" for
 * Rust and another for Arc Raiders — every one of them collapsed onto the same
 * /products/ancient path, so all but one were unreachable.
 *
 * /products/[slug] still resolves and 301s to the canonical URL, so existing
 * links and any ranking they carry survive the move.
 */

interface ProductLike {
  id: number;
  name: string;
  groupName?: string | null;
  categoryName?: string | null;
}

/** Raw slug of a product name. Kept exported: the legacy route matches on it. */
export function productSlugFromName(name: string, productId?: number): string {
  const slug = toGameSlug(name || "").trim();
  if (slug) return slug;
  return typeof productId === "number" ? `product-${productId}` : "product";
}

export function productGameName(product: ProductLike): string {
  return (product.groupName || product.categoryName || "").trim();
}

/** The game segment. "misc" keeps uncategorised products addressable. */
export function productGameSlug(product: ProductLike): string {
  return canonicalGameSlug(productGameName(product)) || "misc";
}

/**
 * The product segment, with the game stripped out when the name already
 * repeats it — KeyHub-style names like "Ancient Arc Raiders" would otherwise
 * produce /products/arc-raiders/ancient-arc-raiders.
 */
/**
 * Locate the run of words inside a product name that names its game, matching
 * through aliases rather than by literal text.
 *
 * Products are named "<product> <game>", but the game half is often an
 * abbreviation: "Crusader R6S" sits in Rainbow Six Siege, "Zcheats EFT" in
 * Escape From Tarkov. A substring test misses both, which produced H1s reading
 * "Crusader R6S Rainbow Six Siege". canonicalGameSlug already resolves those
 * aliases, so every contiguous run of words is canonicalised and compared to
 * the category's slug — longest run first, so "Arc Raiders" wins over "Arc".
 *
 * It also catches the game mid-name ("MEMEZ Rust External"), which prefix and
 * suffix stripping could not reach.
 */
function findGameRun(
  name: string,
  gameSlug: string
): { start: number; length: number; words: string[] } | null {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length || !gameSlug) return null;

  for (let length = words.length; length >= 1; length--) {
    for (let start = 0; start + length <= words.length; start++) {
      const run = words.slice(start, start + length).join(" ");
      if (canonicalGameSlug(run) === gameSlug) return { start, length, words };
    }
  }
  return null;
}

export function productLeafSlug(product: ProductLike): string {
  const full = productSlugFromName(product.name, product.id);
  const game = productGameSlug(product);
  if (!game || game === "misc") return full;

  const run = findGameRun(product.name, game);
  if (run) {
    const remaining = [
      ...run.words.slice(0, run.start),
      ...run.words.slice(run.start + run.length),
    ].join(" ");
    const slug = toGameSlug(remaining).trim();
    // Never strip the name away entirely — a product literally called "Rust"
    // inside the Rust category must keep a usable slug.
    if (slug) return slug;
  }

  return full;
}

export function productHref(product: ProductLike): string {
  return `/products/${productGameSlug(product)}/${productLeafSlug(product)}`;
}

/**
 * Human-readable name including the game, for H1 and titles. Skips the join
 * when the product name already contains the game, so nothing reads
 * "Ancient Arc Raiders Arc Raiders".
 */
export function productDisplayName(product: ProductLike): string {
  const game = productGameName(product);
  if (!game) return product.name;

  // Alias-aware: "Crusader R6S" already names its game, so appending
  // "Rainbow Six Siege" would read "Crusader R6S Rainbow Six Siege".
  if (findGameRun(product.name, productGameSlug(product))) return product.name;

  return `${product.name} ${game}`;
}

/** <title> form. The trailing noun is what product-term searches actually use. */
export function productSeoTitle(product: ProductLike): string {
  return `${productDisplayName(product)} Cheat`;
}

/** Resolve a product from a game + leaf pair, tolerating older leaf forms. */
export function findProductByRoute<T extends ProductLike>(
  products: T[],
  gameSlug: string,
  leafSlug: string
): T | null {
  const game = gameSlug.toLowerCase();
  const leaf = leafSlug.toLowerCase();

  return (
    products.find(
      (p) => productGameSlug(p) === game && productLeafSlug(p) === leaf
    ) ||
    // Fall back to the un-stripped slug so a link built before the game
    // segment was introduced still lands on the right product.
    products.find(
      (p) =>
        productGameSlug(p) === game &&
        productSlugFromName(p.name, p.id) === leaf
    ) ||
    null
  );
}
