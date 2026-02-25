import type { SellAuthProduct } from "@/types/sellauth";

export interface StoreReview {
  id: string;
  rating: number;
  date: string;
  message: string;
  productId: number;
  productName: string;
  productImage: string;
}

const REVIEW_MESSAGES = [
  "Automatic feedback after 7 days.",
  "Solid update cadence and smooth setup.",
  "Undetected so far, performance is stable.",
  "Delivery was instant and key worked first try.",
  "Clean menu and easy configuration.",
  "Support replied quickly and solved my issue.",
];

function fallbackImageFor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("rust")) return "/pd/rust.png";
  if (normalized.includes("valorant") || normalized.includes("val")) {
    return "/pd/valorant.png";
  }
  if (normalized.includes("rainbow") || normalized.includes("r6")) {
    return "/pd/rainbow-six-siege.png";
  }
  if (normalized.includes("apex")) return "/pd/apex.png";
  if (normalized.includes("call of duty") || normalized.includes("cod")) {
    return "/pd/call-of-duty.png";
  }
  return "/games/fortnite.svg";
}

export function createMockReviewsFromProducts(
  products: SellAuthProduct[],
  limit = 16
): StoreReview[] {
  const now = new Date();
  const sourceProducts =
    products.length > 0
      ? products
      : [
          {
            id: 1,
            name: "Rust Prime",
            image: "/pd/rust.png",
          },
        ];

  return Array.from({ length: limit }, (_, index) => {
    const product = sourceProducts[index % sourceProducts.length];
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(index / 4));
    const message = REVIEW_MESSAGES[index % REVIEW_MESSAGES.length];
    const isAutomaticFeedback = message === "Automatic feedback after 7 days.";
    const rating = isAutomaticFeedback ? 5 : index % 7 === 0 ? 4 : 5;

    return {
      id: `review-${product.id}-${index + 1}`,
      rating,
      date: date.toISOString(),
      message,
      productId: product.id,
      productName: product.name,
      productImage: product.image || fallbackImageFor(product.name),
    };
  });
}
