import { InfoPage } from "@/components/info-page";

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
