import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { blogPostsByDate } from "@/lib/blog-posts";
import { jsonLd } from "@/lib/json-ld";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export const metadata: Metadata = {
  title: "Guides & Analysis",
  description:
    "Practical writing on game cheats — which products are worth running, how anti-cheat systems behave, and how to lower your ban risk.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = blogPostsByDate();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Cheat Paradise — Guides & Analysis",
    url: `${siteUrl}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  };

  return (
    <div className="marketplace-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <SiteHeader activeTab="none" />

      <main className="shell subpage-wrap" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 8px" }}>
            Guides &amp; Analysis
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Which products are worth running, how anti-cheat systems actually
            behave, and how to lower your ban risk. Written to be useful whether
            or not you buy from us.
          </p>
        </div>

        {posts.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No posts yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  display: "block",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "18px 20px",
                  textDecoration: "none",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "0.88rem",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                  }}
                >
                  {post.description}
                </p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {new Date(post.published).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {post.readingMinutes} min read
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
