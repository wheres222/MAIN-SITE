import type { Metadata } from "next";
import { getStorefrontData } from "@/lib/sellauth";
import { getMergedStatuses } from "@/lib/status-feed";
import { StatusRouteClient } from "@/components/status-route-client";
import type { StorefrontData } from "@/types/sellauth";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Product Status",
  description: "Live cheat status and detection updates for all Cheat Paradise products. Check availability before you buy — updated in real time.",
  alternates: { canonical: "/status" },
};

export default async function StatusPage() {
  // Both in parallel: the board needs the catalogue and the statuses together,
  // and fetching statuses here is what stops the first paint showing guessed
  // ones until the client poll lands.
  const [initialData, merged] = await Promise.all([
    getStorefrontData().catch(() => null as StorefrontData | null),
    getMergedStatuses().catch(() => null),
  ]);

  return (
    <StatusRouteClient
      initialData={initialData}
      initialStatuses={merged?.statuses ?? {}}
    />
  );
}
