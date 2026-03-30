import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Blog",
  description: "Updates, patch notes, and product announcements from Cheat Paradise. Stay informed on new releases and maintenance.",
  alternates: { canonical: "/blog" },
};

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
