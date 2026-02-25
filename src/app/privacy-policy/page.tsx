import { InfoPage } from "@/components/info-page";

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="How store data is collected and used."
      sections={[
        {
          heading: "Data collection",
          body: [
            "Basic order and account-related data may be collected to process purchases and provide support.",
          ],
        },
        {
          heading: "Data handling",
          body: [
            "Information is used for order fulfillment, fraud prevention, and support operations only.",
            "Sensitive payment operations are handled through secure payment providers.",
          ],
        },
      ]}
    />
  );
}
