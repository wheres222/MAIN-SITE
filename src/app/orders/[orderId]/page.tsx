import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderFulfillmentStatus } from "@/components/order-fulfillment-status";

export const runtime = "edge";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />
      <main className="shell" style={{ paddingTop: 24 }}>
        <OrderFulfillmentStatus orderId={orderId} />
      </main>
      <SiteFooter />
    </div>
  );
}
