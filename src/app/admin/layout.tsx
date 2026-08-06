import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Gates the whole /admin tree at staff level. Individual owner-only pages call
 * requireRole("owner") again — the layout guard is the floor, not the ceiling.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireRole("staff");

  return (
    <AdminShell role={viewer.role} email={viewer.email}>
      {children}
    </AdminShell>
  );
}
