import { Suspense } from "react";
import { ProductRouteClient } from "@/components/product-route-client";

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading product...</p>}>
      <ProductRouteClient />
    </Suspense>
  );
}
