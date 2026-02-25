import { GameCatalogPage } from "@/components/game-catalog-page";
import { isSameGameSlug, toGameSlug } from "@/lib/game-slug";
import { getStorefrontData } from "@/lib/sellauth";
import type { SellAuthGroup } from "@/types/sellauth";

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const storefront = await getStorefrontData();

  const matchedGroup = storefront.groups.find((item) =>
    isSameGameSlug(item.name, gameSlug)
  );

  const products = storefront.products.filter((product) => {
    if (matchedGroup && product.groupId && product.groupId === matchedGroup.id) return true;
    if (product.groupName && isSameGameSlug(product.groupName, gameSlug)) return true;
    return false;
  });

  const group: SellAuthGroup =
    matchedGroup ??
    ({
      id: 0,
      name: gameSlug
        .split("-")
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" "),
      description: "",
      image: { url: "/games/fortnite.svg" },
    } satisfies SellAuthGroup);

  return <GameCatalogPage group={group} products={products} />;
}

export async function generateStaticParams() {
  const storefront = await getStorefrontData();
  return storefront.groups.map((group) => ({
    gameSlug: toGameSlug(group.name),
  }));
}
