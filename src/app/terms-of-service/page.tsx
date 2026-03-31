
import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Cheat Paradise terms of service — usage rules, order policies, and refund conditions for our storefront.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle="The rules and conditions for using this storefront."
      sections={[
        {
          heading: "Usage",
          body: [
            "By using this site, you agree to follow the applicable laws and all listed policies.",
            "Misuse, abuse, or fraudulent activity may result in access restrictions.",
          ],
        },
        {
          heading: "Orders and refunds",
          body: [
            "Order outcomes and refund handling depend on product status and support review.",
          ],
        },
      ]}
    />
  );
}
