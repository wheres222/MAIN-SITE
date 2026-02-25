import { InfoPage } from "@/components/info-page";

export default function FaqPage() {
  return (
    <InfoPage
      title="FAQ"
      subtitle="Common questions and quick answers."
      sections={[
        {
          heading: "How delivery works",
          body: [
            "After successful checkout, access details are provided instantly on the order confirmation flow.",
          ],
        },
        {
          heading: "Support availability",
          body: [
            "Support is available 24/7 through the support page and Discord ticket channels.",
          ],
        },
      ]}
    />
  );
}
