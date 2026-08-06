import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { AdminTrafficPanel } from "@/components/admin-traffic-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traffic",
  robots: { index: false, follow: false },
};

export default async function AdminTrafficPage() {
  await requireRole("staff");

  return <AdminTrafficPanel />;
}
