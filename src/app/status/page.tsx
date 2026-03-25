import type { Metadata } from "next";
import { StatusRouteClient } from "@/components/status-route-client";

export const metadata: Metadata = {
  title: "Product Status",
  description: "Live cheat status and detection updates for all Cheat Paradise products. Check availability before you buy — updated in real time.",
  alternates: { canonical: "/status" },
};

export default function StatusPage() {
  return <StatusRouteClient />;
}
