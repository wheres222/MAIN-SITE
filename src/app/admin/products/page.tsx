import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { AdminProductsManager } from "@/components/admin-products-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await requireRole("staff");

  return <AdminProductsManager />;
}
