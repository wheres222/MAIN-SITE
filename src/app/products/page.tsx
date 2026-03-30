import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductRouteClient } from "@/components/product-route-client";
import { SubpageSkeleton } from "@/components/subpage-skeleton";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse game cheats and hacks for Rust, Valorant, Fortnite, COD, CS2, Apex, R6, and more. Instant delivery, secure checkout, and 24/7 support.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<SubpageSkeleton rows={5} />}>
      <ProductRouteClient />
    </Suspense>
  );
}
