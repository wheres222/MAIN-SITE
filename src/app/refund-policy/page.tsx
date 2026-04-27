import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Cheat Paradise refund policy — all sales are final. Read our no-refund policy before purchasing.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <InfoPage
      title="Refund Policy"
      subtitle="Please read this policy carefully before completing any purchase."
      sections={[
        {
          heading: "All Sales Are Final",
          body: [
            "All purchases made on Cheat Paradise are final and non-refundable. By completing a purchase you acknowledge and agree to this policy.",
            "Due to the digital and instant-delivery nature of our products, we are unable to offer refunds, exchanges, or credits under any circumstances once an order has been placed.",
          ],
        },
        {
          heading: "Why We Cannot Issue Refunds",
          body: [
            "Our products are delivered instantly and electronically. Once a license key or access credential has been issued, it cannot be revoked or reused, making refunds impractical.",
            "Digital goods are exempt from standard consumer return rights in most jurisdictions once they have been accessed or downloaded.",
          ],
        },
        {
          heading: "Exceptions",
          body: [
            "In the rare event that you did not receive your product due to a verified technical failure on our end, please open a support ticket within 24 hours of purchase and our team will investigate.",
            "Duplicate charges caused by a payment processor error may be reviewed on a case-by-case basis. Contact support with your order ID and proof of the duplicate transaction.",
          ],
        },
        {
          heading: "Chargebacks",
          body: [
            "Initiating a chargeback or payment dispute without first contacting our support team will result in an immediate and permanent ban from all Cheat Paradise services.",
            "We maintain detailed transaction records and will respond to all disputes with full documentation.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "If you have a question about an order before purchasing, please contact us via our Discord server or the Support page — we are happy to help.",
          ],
        },
      ]}
    />
  );
}
