import { Suspense } from "react";
import { CheckoutPaymentClient } from "@/components/checkout-payment-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0c0f",
          }}
        >
          <p style={{ color: "#64748b", fontSize: 15 }}>Loading order…</p>
        </div>
      }
    >
      <CheckoutPaymentClient orderId={orderId} />
    </Suspense>
  );
}
