import { Suspense } from "react";
import { OrderRouteClient } from "@/components/order-route-client";

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading order...</p>}>
      <OrderRouteClient />
    </Suspense>
  );
}
