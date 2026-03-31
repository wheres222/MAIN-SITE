
import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderRouteClient } from "@/components/order-route-client";

export const metadata: Metadata = {
  title: "Order Status",
  description: "Track order status and delivery keys.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: { canonical: "/orders" },
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="state-message" style={{ padding: "20px" }}>Loading order...</p>}>
      <OrderRouteClient />
    </Suspense>
  );
}
