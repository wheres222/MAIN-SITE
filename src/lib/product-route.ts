import { toGameSlug } from "@/lib/game-slug";

interface ProductHrefOptions {
  includePidQuery?: boolean;
}

export function productSlugFromName(name: string, productId?: number): string {
  const slug = toGameSlug(name || "").trim();
  if (slug) return slug;
  return typeof productId === "number" ? `product-${productId}` : "product";
}

export function productHref(
  product: { id: number; name: string },
  options: ProductHrefOptions = {}
): string {
  const base = `/products/${encodeURIComponent(productSlugFromName(product.name, product.id))}`;
  if (options.includePidQuery === false) return base;
  return `${base}?pid=${product.id}`;
}
