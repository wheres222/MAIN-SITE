import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminProductsManager } from "@/components/admin-products-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
    redirect("/");
  }

  return <AdminProductsManager />;
}
