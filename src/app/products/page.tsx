import type { Metadata } from "next";
import { ProductsCatalogClient } from "@/components/products-catalog-client";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse all undetected game cheats and hacks — Rust, Fortnite, CS2, ARC Raiders, R6, Apex and more. Instant delivery, secure checkout, 24/7 support.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return <ProductsCatalogClient />;
}
