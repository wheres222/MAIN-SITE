import { Suspense } from "react";
import { CategoryRouteClient } from "@/components/category-route-client";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading category...</p>}>
      <CategoryRouteClient />
    </Suspense>
  );
}
