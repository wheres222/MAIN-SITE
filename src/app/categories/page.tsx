import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRouteClient } from "@/components/category-route-client";

export const metadata: Metadata = {
  title: "Game Categories",
  description:
    "Browse cheap gaming categories and find tools, accounts, and enhancements with fast delivery.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading category...</p>}>
      <CategoryRouteClient />
    </Suspense>
  );
}
