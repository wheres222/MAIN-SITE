import type { Metadata } from "next";
import { DashboardPreview } from "@/components/dashboard-preview";

export const metadata: Metadata = {
  title: "Dashboard Preview",
  description: "Open preview of the account dashboard UI.",
  robots: { index: false, follow: false },
};

export default function DashboardPreviewPage() {
  return <DashboardPreview />;
}
