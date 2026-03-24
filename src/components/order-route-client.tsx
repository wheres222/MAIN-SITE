"use client";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderFulfillmentStatus } from "@/components/order-fulfillment-status";
import { useSearchParams } from "next/navigation";

export function OrderRouteClient() {
  const searchParams = useSearchParams();
  const orderId = (searchParams.get("orderId") || "").trim();
  const token = (searchParams.get("token") || "").trim();

  return (
    <div className="marketplace-page order-page-layout">
      <SiteHeader activeTab="store" />
      <main className="shell order-page-main">
        {orderId ? (
          <OrderFulfillmentStatus orderId={orderId} token={token} />
        ) : (
          <section className="postpay-shell">
            <div className="postpay-card">
              <header className="postpay-top">
                <span className="postpay-top-icon">i</span>
                <h2>Order ID required</h2>
                <p>
                  We couldn&apos;t find an order reference in this link. Open this page from your
                  checkout confirmation link or contact support with your invoice/order ID.
                </p>
              </header>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
