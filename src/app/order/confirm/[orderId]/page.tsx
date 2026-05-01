import { Suspense } from "react";
import { OrderConfirmClient } from "@/components/order-confirm-client";

export const dynamic = "force-dynamic";

export default async function OrderConfirmPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 20px" }}>
          <div style={{ color: "#94a3b8", fontSize: 15 }}>Loading order…</div>
        </div>
      }
    >
      <OrderConfirmClient orderId={orderId} />
    </Suspense>
  );
}
