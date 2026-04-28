import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminStatusManager } from "@/components/admin-status-manager";

export const dynamic = "force-dynamic";

export default async function AdminStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
    redirect("/");
  }

  return <AdminStatusManager />;
}
