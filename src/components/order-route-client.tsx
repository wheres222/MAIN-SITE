"use client";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderFulfillmentStatus } from "@/components/order-fulfillment-status";
import { useSearchParams } from "next/navigation";

export function OrderRouteClient() {
  const searchParams = useSearchParams();
  const orderId = (searchParams.get("orderId") || "mock").trim();
  const isMock = orderId.toLowerCase() === "mock";

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />
      <main className="shell" style={{ paddingTop: 24 }}>
        <OrderFulfillmentStatus
          orderId={orderId}
          mockData={
            isMock
              ? {
                  orderId: "MOCK-10415520",
                  status: "fulfilled",
                  updatedAt: new Date().toISOString(),
                  paymentMethod: "Litecoin (LTC)",
                  total: "$35",
                  customerEmail: "buyer@example.com",
                  transactionId: "CA-016766",
                  subtitle: "1 day",
                  bonusPoints: "0.0279",
                  items: [
                    {
                      name: "UNKNOWN Lite for APEX",
                      quantity: 35,
                      note: "Auto-delivered after payment",
                    },
                  ],
                  licenseKeys: ["DAY_0D8B5B1AF9I9F87D825927FEB3549BC"],
                }
              : undefined
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
