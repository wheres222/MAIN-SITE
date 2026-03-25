import type { Metadata } from "next";
import { ReviewsRouteClient } from "@/components/reviews-route-client";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Read verified customer reviews for Cheat Paradise game cheats. See real feedback on Rust, Valorant, Fortnite, COD, CS2, and more products.",
  alternates: { canonical: "/reviews" },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export default function ReviewsPage() {
  const aggregateRatingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Cheat Paradise Products",
    url: siteUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "1247",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }}
      />
      <ReviewsRouteClient />
    </>
  );
}
