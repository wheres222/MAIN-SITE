import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductRouteClient } from "@/components/product-route-client";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse game cheats and hacks for Rust, Valorant, Fortnite, COD, CS2, Apex, R6, and more. Instant delivery, secure checkout, and 24/7 support.",
  alternates: { canonical: "/products" },
};

export default function ProductSlugPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading product...</p>}>
      <ProductRouteClient />
    </Suspense>
  );
}
