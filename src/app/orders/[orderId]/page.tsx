import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderFulfillmentStatus } from "@/components/order-fulfillment-status";

export const runtime = "edge";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;
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
