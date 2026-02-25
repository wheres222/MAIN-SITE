import { GameCatalogPage } from "@/components/game-catalog-page";
import { isSameGameSlug, toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import type { SellAuthGroup } from "@/types/sellauth";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const storefront = await getStorefrontData();

  const matchedCategory = storefront.categories.find((item) =>
    isSameGameSlug(item.name, categorySlug)
  );

  const products = storefront.products.filter((product) => {
    if (matchedCategory && product.categoryId === matchedCategory.id) return true;
    if (product.categoryName && isSameGameSlug(product.categoryName, categorySlug))
      return true;
    if (!matchedCategory && product.groupName) {
      return isSameGameSlug(product.groupName, categorySlug);
    }
    return false;
  });

  const matchedGroup =
    storefront.groups.find((item) => isSameGameSlug(item.name, categorySlug)) ||
    storefront.groups.find((item) => item.id === products[0]?.groupId);

  const fallbackImage =
    matchedCategory?.image?.url || products[0]?.image || "/games/fortnite.svg";

  const group: SellAuthGroup =
    matchedGroup ??
    ({
      id: matchedCategory?.id || 0,
      name: matchedCategory?.name || titleCaseFromSlug(categorySlug),
      description: matchedCategory?.description || "",
      image: { url: fallbackImage },
    } satisfies SellAuthGroup);

  return <GameCatalogPage group={group} products={products} />;
}

export async function generateStaticParams() {
  const storefront = await getStorefrontData();
  const slugs = new Set<string>();

  storefront.categories.forEach((category) => {
    slugs.add(toGameSlug(category.name));
  });

  storefront.groups.forEach((group) => {
    slugs.add(toGameSlug(group.name));
  });

  return [...slugs].map((categorySlug) => ({ categorySlug }));
}
