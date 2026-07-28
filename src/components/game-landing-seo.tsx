/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { GameSeoContent } from "@/lib/game-seo-content";
import { GAME_SEO_CONTENT } from "@/lib/game-seo-content";
import { LazyVideo } from "@/components/lazy-video";
import styles from "./game-landing-seo.module.css";

interface GameLandingSeoProps {
  content: GameSeoContent;
}

/**
 * SEO content rendered BELOW the product grid (conversion-optimised — users
 * land on products first).
 *
 * Layout pattern (renders N sections — not capped):
 *   - Header — H1 + "last tested" badge + lead paragraph + 4-tile trust strip
 *   - Section 0       → text-only
 *   - Section 1       → side-by-side text + heroImage (image on right)
 *   - Section 2       → side-by-side text + video    (text on right)
 *   - Sections 3..N-2 → text-only
 *   - Section N-1     → text-only closing CTA
 *
 * Server-rendered — Googlebot indexes everything without JS execution.
 */
const TRUST_STATS = [
  { value: "4.9 ★",  label: "Average Rating" },
  { value: "99%",    label: "Satisfaction Rate" },
  { value: "24/7",   label: "Live Protection" },
  { value: "Instant", label: "Key Delivery" },
];

export function GameLandingIntro({ content }: GameLandingSeoProps) {
  const sections = content.sections;

  return (
    <section className={styles.landing} aria-label={`About ${content.displayName} cheats`}>
      {/* ── Header: intro heading, last-tested badge, lead, trust stats ──
          h2 (not h1): the page's single H1 is the catalog header up top,
          which receives content.h1 via GameCatalogPage's title prop. */}
      <header className={styles.intro}>
        <div className={styles.headRow}>
          <h2 className={styles.h1}>{content.h1}</h2>
          <span className={styles.tested} aria-label="Last verified">
            <span className={styles.testedDot} aria-hidden="true" />
            Last tested: {content.lastTested}
          </span>
        </div>
        <p className={styles.lead}>{content.lead}</p>

        <ul className={styles.trustStrip} aria-label="Trust indicators">
          {TRUST_STATS.map((stat) => (
            <li key={stat.label} className={styles.trustItem}>
              <span className={styles.trustValue}>{stat.value}</span>
              <span className={styles.trustLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>
      </header>

      {/* ── Sections (render all of them) ───────────────────────────────── */}
      {sections.map((section, i) => {
        // Split body on blank lines into paragraphs.
        const paragraphs = section.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
        const SectionBody = () => (
          <>
            {paragraphs.map((para, p) => (
              <p key={p} className={styles.body}>{para}</p>
            ))}
            {section.bullets && (
              <div className={styles.bullets}>
                {section.bullets.heading && (
                  <h3 className={styles.bulletHeading}>{section.bullets.heading}</h3>
                )}
                <ul className={styles.bulletList}>
                  {section.bullets.items.map((item, b) => (
                    <li key={b}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );

        // Layout pattern: 0 text-only, 1 text+image-right, 2 video+text-right,
        // anything else text-only. Keeps rich media near the top where
        // engagement is highest, then long-form prose below.
        if (i === 1 && content.heroImage) {
          return (
            <article key={i} className={`${styles.block} ${styles.split} ${styles.splitTextLeft}`}>
              <div className={styles.splitText}>
                <h2 className={styles.h2}>{section.heading}</h2>
                <SectionBody />
              </div>
              <div className={styles.splitMedia}>
                <img
                  src={content.heroImage}
                  alt={`${content.displayName} cheat preview`}
                  loading="lazy"
                  decoding="async"
                  className={styles.splitImage}
                />
              </div>
            </article>
          );
        }

        if (i === 2 && content.videoSrc) {
          return (
            <article key={i} className={`${styles.block} ${styles.split} ${styles.splitTextRight}`}>
              <div className={styles.splitMedia}>
                <LazyVideo
                  className={styles.splitVideo}
                  src={content.videoSrc}
                  poster={content.videoPoster ?? content.heroImage ?? ""}
                  ariaLabel={`${content.displayName} cheat gameplay footage`}
                />
              </div>
              <div className={styles.splitText}>
                <h2 className={styles.h2}>{section.heading}</h2>
                <SectionBody />
              </div>
            </article>
          );
        }

        return (
          <article key={i} className={styles.block}>
            <h2 className={styles.h2}>{section.heading}</h2>
            <SectionBody />
          </article>
        );
      })}
    </section>
  );
}

/**
 * Bottom-of-page FAQ accordion + cross-links to other game pages.
 * Includes FAQPage schema (rendered from the page route, not here).
 */
export function GameLandingFaq({ content }: GameLandingSeoProps) {
  const otherGames = GAME_SEO_CONTENT.filter((g) => g.slug !== content.slug);

  return (
    <section className={styles.faqWrap} aria-label="Frequently asked questions">
      <div className={styles.faqInner}>
        <h2 className={styles.faqHeading}>{content.displayName} Cheats — FAQ</h2>
        <div className={styles.faqList}>
          {content.faqs.map((faq) => (
            <details key={faq.q} className={styles.faqItem}>
              <summary className={styles.faqQ}>{faq.q}</summary>
              <p className={styles.faqA}>{faq.a}</p>
            </details>
          ))}
        </div>

        {otherGames.length > 0 && (
          <div className={styles.relatedWrap}>
            <h3 className={styles.relatedHeading}>Other game cheats</h3>
            <ul className={styles.relatedList}>
              {otherGames.map((g) => (
                <li key={g.slug}>
                  <Link href={`/categories/${g.slug}`} className={styles.relatedLink}>
                    {g.displayName} Cheats
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
