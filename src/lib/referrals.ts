import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * Credit a referrer when a referred buyer's order is confirmed.
 *
 * This is the half of the affiliate programme that did not exist. Referrals
 * were recorded at signup with commission_amount = 0 and nothing ever updated
 * them, so the dashboard always showed zero and cash-out — which needs at least
 * $1.00 — was unreachable for everyone.
 *
 * Call it from a payment webhook *after* the pending → paid lock has been won,
 * so it runs once per order. The database function is idempotent on order_id as
 * well, so a retry that somehow slipped past the lock still cannot double-pay.
 *
 * Never throws. A failure here means a commission was missed, which is
 * recoverable; letting it propagate would abort fulfilment and cost the
 * customer what they paid for, which is not.
 */
export async function creditReferral(
  admin: SupabaseClient,
  buyerId: string | null,
  orderId: string,
  orderTotal: number | null
): Promise<void> {
  // Guest checkouts have no account, so there is nobody to attribute.
  if (!buyerId || !orderTotal || orderTotal <= 0) return;

  try {
    const { data, error } = await admin.rpc("credit_referral_commission", {
      p_buyer_id: buyerId,
      p_order_id: orderId,
      p_order_total: orderTotal,
    });

    if (error) {
      logger.error("Referral commission failed", {
        orderId,
        buyerId,
        err: error.message,
      });
      return;
    }

    const amount = Number(data ?? 0);
    if (amount > 0) {
      logger.info("Referral commission credited", { orderId, buyerId, amount });
    }
  } catch (err) {
    // Migration not applied yet, or Supabase unavailable.
    logger.error("Referral commission threw", {
      orderId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
