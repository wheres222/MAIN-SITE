import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReviewsBoard } from "@/components/reviews-board";
import { createMockReviewsFromProducts } from "@/lib/reviews";
import { getStorefrontData } from "@/lib/sellauth";

export default async function ReviewsPage() {
  const storefront = await getStorefrontData();
  const reviews = createMockReviewsFromProducts(storefront.products, 16);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="reviews" />
      <main className="shell subpage-wrap">
        <ReviewsBoard reviews={reviews} />
      </main>
      <SiteFooter />
    </div>
  );
}
