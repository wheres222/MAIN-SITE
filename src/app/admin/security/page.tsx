import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { AdminSecurityPanel } from "@/components/admin-security-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

export default async function AdminSecurityPage() {
  await requireRole("owner");

  return <AdminSecurityPanel />;
}
