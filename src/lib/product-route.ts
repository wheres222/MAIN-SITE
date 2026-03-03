import { toGameSlug } from "@/lib/game-slug";

export function productSlugFromName(name: string, productId?: number): string {
  const slug = toGameSlug(name || "").trim();
  if (slug) return slug;
  return typeof productId === "number" ? `product-${productId}` : "product";
}

export function productHref(product: { id: number; name: string }): string {
  return `/products/${encodeURIComponent(productSlugFromName(product.name, product.id))}`;
}
