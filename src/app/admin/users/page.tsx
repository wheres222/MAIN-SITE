import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { AdminUsersPanel } from "@/components/admin-users-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const viewer = await requireRole("owner");

  return <AdminUsersPanel viewerId={viewer.userId} />;
}
