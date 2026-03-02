import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductRouteClient } from "@/components/product-route-client";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Shop gaming products with instant delivery, secure checkout, and active support.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading product...</p>}>
      <ProductRouteClient />
    </Suspense>
  );
}
