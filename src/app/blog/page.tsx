import { InfoPage } from "@/components/info-page";

export default function BlogPage() {
  return (
    <InfoPage
      title="Blog"
      subtitle="Updates, patch notes, and product announcements."
      sections={[
        {
          heading: "What gets posted",
          body: [
            "Feature rollouts, support notices, maintenance updates, and release summaries.",
          ],
        },
        {
          heading: "Posting schedule",
          body: [
            "New posts are published whenever major updates or important notices are available.",
          ],
        },
      ]}
    />
  );
}
