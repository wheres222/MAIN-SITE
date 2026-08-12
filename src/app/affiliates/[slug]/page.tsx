import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/info-page";
import { affiliateGuideBySlug, allAffiliateGuideSlugs } from "@/lib/affiliate-guides";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export function generateStaticParams() {
  return allAffiliateGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = affiliateGuideBySlug(slug);
  if (!guide) return { title: "Affiliates", alternates: { canonical: "/affiliates" } };

  const canonical = `/affiliates/${guide.slug}`;
  return {
    title: guide.seoTitle,
    description: guide.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: guide.seoTitle,
      description: guide.description,
      url: `${siteUrl}${canonical}`,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
}

export default async function AffiliateGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = affiliateGuideBySlug(slug);
  if (!guide) notFound();

  const url = `${siteUrl}/affiliates/${guide.slug}`;

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: "Cheat Paradise", url: siteUrl },
      publisher: { "@type": "Organization", name: "Cheat Paradise", url: siteUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Affiliates", item: `${siteUrl}/affiliates` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
  ];

  const sections = [
    ...guide.sections,
    {
      heading: "Frequently asked questions",
      body: guide.faqs.flatMap((f) => [f.q, f.a]),
    },
    {
      heading: "Join the program",
      body: [
        "Commission tiers and how attribution works are on the affiliate program page at /affiliates.",
        "Your referral code is on your account's referrals page once you have signed up.",
      ],
    },
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <InfoPage title={guide.title} subtitle={guide.lead} sections={sections} />
    </>
  );
}
