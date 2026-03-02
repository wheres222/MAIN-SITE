import type { Metadata } from "next";
import { ReviewsRouteClient } from "@/components/reviews-route-client";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Read customer reviews and community feedback on top products.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return <ReviewsRouteClient />;
}
