import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRouteClient } from "@/components/category-route-client";

export const metadata: Metadata = {
  title: "Game Categories",
  description:
    "Browse cheat categories by game — Rust, Valorant, Fortnite, COD, CS2, Apex, Rainbow Six Siege, PUBG, Roblox, and more. Instant delivery.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading category...</p>}>
      <CategoryRouteClient />
    </Suspense>
  );
}
