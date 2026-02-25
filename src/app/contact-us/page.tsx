import { InfoPage } from "@/components/info-page";
import { getDiscordUrl } from "@/lib/links";

export default function ContactUsPage() {
  const discordUrl = getDiscordUrl();

  return (
    <InfoPage
      title="Contact Us"
      subtitle="Reach out using the method that fits your issue best."
      sections={[
        {
          heading: "Fastest Support",
          body: [
            `Join our Discord support server: ${discordUrl}`,
            "Open a ticket with your order ID and clear issue details for the fastest response.",
          ],
        },
        {
          heading: "Order Questions",
          body: [
            "For checkout, payment, or delivery issues, include your product name and transaction details.",
          ],
        },
      ]}
    />
  );
}
