import type { Metadata } from "next";
import { StatusRouteClient } from "@/components/status-route-client";

export const metadata: Metadata = {
  title: "Product Status",
  description: "Check live product status and availability updates.",
  alternates: { canonical: "/status" },
};

export default function StatusPage() {
  return <StatusRouteClient />;
}
