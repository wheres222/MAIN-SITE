import type { Metadata } from "next";
import { getStorefrontData } from "@/lib/sellauth";
import { StatusRouteClient } from "@/components/status-route-client";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Product Status",
  description: "Live cheat status and detection updates for all Cheat Paradise products. Check availability before you buy — updated in real time.",
  alternates: { canonical: "/status" },
};

export default async function StatusPage() {
  let initialData: StorefrontData | null = null;
  try {
    initialData = await getStorefrontData();
  } catch {
    // Client-side fetch will handle it
  }
  return <StatusRouteClient initialData={initialData} />;
}
