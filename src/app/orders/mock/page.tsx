import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderFulfillmentStatus } from "@/components/order-fulfillment-status";

export const runtime = "edge";

export default function MockOrderPage() {
  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />
      <main className="shell" style={{ paddingTop: 24 }}>
        <OrderFulfillmentStatus
          orderId="MOCK-10415520"
          mockData={{
            orderId: "MOCK-10415520",
            status: "fulfilled",
            updatedAt: new Date().toISOString(),
            paymentMethod: "Litecoin (LTC)",
            total: "$74.75",
            customerEmail: "buyer@example.com",
            transactionId: "3f5d2b1a9c8e7f60",
            items: [
              {
                name: "Mails – GMX.COM",
                quantity: 25,
                note: "Bulk pack – auto delivery",
              },
              {
                name: "Discord Nitro 3 Month",
                quantity: 1,
                note: "Account + redemption instructions",
              },
            ],
            licenseKeys: [
              "MAIL-GMX-7PXJ-4B2D-9QTF",
              "MAIL-GMX-A2KJ-31PD-X8MF",
              "NITRO-3M-J9KD-22PA-7QWM",
            ],
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
