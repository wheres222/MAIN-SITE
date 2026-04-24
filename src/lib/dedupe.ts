/**
 * DB-backed delivery deduplication using the delivery_logs table.
 * Survives server restarts, cold starts, and multi-instance deployments.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export type DeliveryState = "pending" | "done" | "failed";

export interface DeliveryRecord {
  state: DeliveryState;
  deliveryId?: string;
}

/** Returns the existing record for an order, or null if not seen before. */
export async function getDeliveryRecord(orderId: string): Promise<DeliveryRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("delivery_logs")
    .select("state, delivery_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return { state: data.state as DeliveryState, deliveryId: data.delivery_id ?? undefined };
}

/** Upserts (insert or update) a delivery record. */
export async function setDeliveryRecord(
  orderId: string,
  state: DeliveryState,
  deliveryId?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("delivery_logs").upsert(
    { order_id: orderId, state, delivery_id: deliveryId ?? null, updated_at: new Date().toISOString() },
    { onConflict: "order_id" }
  );
}

/** Removes a delivery record so a genuine retry can attempt redelivery. */
export async function deleteDeliveryRecord(orderId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("delivery_logs").delete().eq("order_id", orderId);
}
