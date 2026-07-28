import type { Metadata } from "next";
import { ProductsCatalogClient } from "@/components/products-catalog-client";
import { getStorefrontData } from "@/lib/sellauth";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse all undetected game cheats and hacks — Rust, Fortnite, CS2, ARC Raiders, R6, Apex and more. Instant delivery, secure checkout, 24/7 support.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  // Server-render the catalog so the full product list ships in the HTML.
  // Previously this page sent only a loading skeleton and filled in client
  // side, so crawlers saw an empty page. Falls back to the client fetch if
  // SellAuth is slow or errors.
  let initialData: StorefrontData | null = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 3000)
    );
    initialData = await Promise.race([getStorefrontData(), timeout]);
  } catch {
    // Fall through to client-side fetch on error
  }

  return <ProductsCatalogClient initialData={initialData} />;
}
