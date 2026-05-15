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

/**
 * Atomically claims an order for delivery by INSERTing a "pending" row.
 * Returns true if the claim succeeded (this process owns delivery).
 * Returns false if another process already inserted a row for this order.
 * Unlike setDeliveryRecord (upsert), this is safe against concurrent webhook invocations.
 */
export async function claimDeliveryRecord(orderId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("delivery_logs").insert({
    order_id:   orderId,
    state:      "pending" as DeliveryState,
    updated_at: new Date().toISOString(),
  });
  // Unique constraint violation (code 23505) means another handler already claimed it.
  // Any other error is also treated as "not claimed" to prevent accidental double-delivery.
  return !error;
}

/** Updates an existing delivery record — only call after claimDeliveryRecord succeeds. */
export async function setDeliveryRecord(
  orderId: string,
  state: DeliveryState,
  deliveryId?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("delivery_logs")
    .update({ state, delivery_id: deliveryId ?? null, updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
}

/** Marks a failed delivery so it won't auto-retry. Use for permanent failures. */
export async function failDeliveryRecord(orderId: string, reason?: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("delivery_logs")
    .update({ state: "failed" as DeliveryState, delivery_id: reason ?? null, updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
}
