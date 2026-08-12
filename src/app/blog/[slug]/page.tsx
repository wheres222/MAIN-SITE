import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/info-page";
import { allBlogSlugs, blogPostBySlug } from "@/lib/blog-posts";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export function generateStaticParams() {
  return allBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) return { title: "Blog", alternates: { canonical: "/blog" } };

  const canonical = `/blog/${post.slug}`;
  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.seoTitle,
      description: post.description,
      url: `${siteUrl}${canonical}`,
      publishedTime: post.published,
      modifiedTime: post.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;

  // BlogPosting carries the author and dates Google uses to judge freshness;
  // FAQPage is what produces the expandable answers in the results page, which
  // is the whole reason each post ends with real questions rather than filler.
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: "Cheat Paradise", url: siteUrl },
      publisher: {
        "@type": "Organization",
        name: "Cheat Paradise",
        url: siteUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  const sections = [
    ...post.sections.map((s) => ({ heading: s.heading, body: s.body })),
    {
      heading: "Frequently asked questions",
      body: post.faqs.flatMap((f) => [f.q, f.a]),
    },
    // A closing pointer back into the storefront. Editorial pages that never
    // link to anything buyable collect traffic and convert none of it.
    {
      heading: "Check before you buy",
      body: [
        "Live detection status for every product is on the status page, updated automatically from our supplier feed rather than by hand.",
        post.relatedGameSlug
          ? `The current lineup is at /categories/${post.relatedGameSlug}, and every product page shows its own status.`
          : "Every product page shows its own live status.",
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

      <InfoPage
        title={post.title}
        subtitle={post.lead}
        sections={sections}
      />
    </>
  );
}
