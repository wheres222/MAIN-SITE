import { Fragment } from "react";
import Link from "next/link";
import type { PageSeoContent } from "@/lib/page-seo-content";
import styles from "./page-seo-sections.module.css";

/**
 * The editorial half of the site's utility pages — /products, /status,
 * /support, /guide and the rest.
 *
 * Those pages were each 150-650 rendered words of mostly interactive chrome,
 * and Search Console filed all eleven of them under "Crawled - currently not
 * indexed": Google fetched them, judged there was nothing worth storing, and
 * moved on. This block is what gives them something to store.
 *
 * Server-rendered, no client boundary, and the FAQ uses <details> rather than
 * a JS accordion, so every word is in the initial HTML.
 */

/**
 * Renders `[label](/path)` inside body copy as a real <Link>.
 *
 * Content stays plain data in page-seo-content.ts, but these pages still need
 * to pass link equity to the category and product pages that actually sell —
 * an editorial block with no outbound internal links is a dead end for a
 * crawler.
 */
const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

function renderBody(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  // exec with /g is stateful; a fresh regex per call keeps concurrent renders
  // from sharing lastIndex.
  const pattern = new RegExp(LINK_PATTERN.source, "g");

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <Link key={`${keyPrefix}-${match.index}`} href={match[2]} className={styles.link}>
        {match[1]}
      </Link>
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.map((node, i) => <Fragment key={`${keyPrefix}-f${i}`}>{node}</Fragment>);
}

export function PageSeoSections({
  content,
  /**
   * Emit FAQPage schema alongside the visible answers.
   *
   * Off for /faq and /support, which already publish their own FAQPage from
   * their existing question lists — two FAQPage blocks on one URL is a
   * structured-data error, so those pages merge these questions into the
   * schema they already have instead.
   */
  faqSchema = true,
}: {
  content: PageSeoContent;
  faqSchema?: boolean;
}) {
  const schema = faqSchema ? pageSeoFaqSchema(content) : null;

  return (
    <section className={styles.wrap} aria-label={content.heading}>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}

      <header className={styles.head}>
        {/* h2, not h1 — these pages already carry their own H1 above. */}
        <h2 className={styles.h2}>{content.heading}</h2>
        <p className={styles.lead}>{renderBody(content.lead, "lead")}</p>
      </header>

      {content.sections.map((section, s) => (
        <article key={section.heading} className={styles.block}>
          <h3 className={styles.h3}>{section.heading}</h3>
          {section.body.map((para, p) => (
            <p key={p} className={styles.p}>
              {renderBody(para, `s${s}p${p}`)}
            </p>
          ))}

          {section.bullets && (
            <div className={styles.bullets}>
              {section.bullets.heading && (
                <h4 className={styles.bulletHeading}>{section.bullets.heading}</h4>
              )}
              <ul className={styles.list}>
                {section.bullets.items.map((item, i) => (
                  <li key={i}>{renderBody(item, `s${s}b${i}`)}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}

      {content.faqs.length > 0 && (
        <div className={styles.faqWrap}>
          <h3 className={styles.faqHeading}>{content.faqHeading ?? "Common questions"}</h3>
          {content.faqs.map((faq) => (
            <details key={faq.q} className={styles.faqItem}>
              <summary className={styles.faqQ}>{faq.q}</summary>
              <p className={styles.faqA}>{renderBody(faq.a, faq.q)}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * FAQPage schema for a utility page.
 *
 * Kept beside the renderer so the visible answers and the structured ones can
 * never drift apart — Google treats a FAQPage whose answers are not on the
 * page as a structured-data violation.
 */
export function pageSeoFaqSchema(content: PageSeoContent) {
  if (content.faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        // Strip the link markup — schema wants plain text.
        text: faq.a.replace(LINK_PATTERN, "$1"),
      },
    })),
  };
}
