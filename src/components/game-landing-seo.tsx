/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { GameSeoContent } from "@/lib/game-seo-content";
import { GAME_SEO_CONTENT } from "@/lib/game-seo-content";
import styles from "./game-landing-seo.module.css";

interface GameLandingSeoProps {
  content: GameSeoContent;
}

/**
 * SEO content rendered BELOW the product grid (conversion-optimised — users
 * land on products first). Modelled on the SSZ.gg landing page structure:
 *
 *   1. Hero intro block — H1 + "last tested" badge + lead paragraph
 *   2. Section 1 — pure text, multi-paragraph essay style
 *   3. Section 2 — side-by-side text + heroImage
 *   4. Section 3 — side-by-side text + footage video (if available)
 *   5. Section 4 — text-only with feature subsections
 *
 * Server-rendered, so Googlebot indexes everything immediately without
 * waiting for JavaScript execution.
 */
export function GameLandingIntro({ content }: GameLandingSeoProps) {
  const [s1, s2, s3, s4] = content.sections;

  return (
    <section className={styles.landing} aria-label={`About ${content.displayName} cheats`}>
      {/* ── 1. Hero intro ───────────────────────────────────────────────── */}
      <header className={styles.intro}>
        <div className={styles.headRow}>
          <h1 className={styles.h1}>{content.h1}</h1>
          <span className={styles.tested} aria-label="Last verified">
            <span className={styles.testedDot} aria-hidden="true" />
            Last tested: {content.lastTested}
          </span>
        </div>
        <p className={styles.lead}>{content.lead}</p>
      </header>

      {/* ── 2. Text-only first section ──────────────────────────────────── */}
      {s1 && (
        <article className={styles.block}>
          <h2 className={styles.h2}>{s1.heading}</h2>
          <p className={styles.body}>{s1.body}</p>
        </article>
      )}

      {/* ── 3. Side-by-side: text + hero image ──────────────────────────── */}
      {s2 && (
        <article className={`${styles.block} ${styles.split} ${styles.splitTextLeft}`}>
          <div className={styles.splitText}>
            <h2 className={styles.h2}>{s2.heading}</h2>
            <p className={styles.body}>{s2.body}</p>
          </div>
          <div className={styles.splitMedia}>
            {content.heroImage ? (
              <img
                src={content.heroImage}
                alt={`${content.displayName} cheat preview`}
                loading="lazy"
                decoding="async"
                className={styles.splitImage}
              />
            ) : (
              <div className={styles.mediaPlaceholder} aria-hidden="true" />
            )}
          </div>
        </article>
      )}

      {/* ── 4. Side-by-side: text + video (reversed) ────────────────────── */}
      {s3 && (
        <article className={`${styles.block} ${styles.split} ${styles.splitTextRight}`}>
          <div className={styles.splitMedia}>
            {content.videoSrc ? (
              <video
                className={styles.splitVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                aria-label={`${content.displayName} cheat gameplay footage`}
              >
                <source src={content.videoSrc} type="video/mp4" />
              </video>
            ) : content.heroImage ? (
              <img
                src={content.heroImage}
                alt={`${content.displayName} cheat preview`}
                loading="lazy"
                decoding="async"
                className={styles.splitImage}
              />
            ) : (
              <div className={styles.mediaPlaceholder} aria-hidden="true" />
            )}
          </div>
          <div className={styles.splitText}>
            <h2 className={styles.h2}>{s3.heading}</h2>
            <p className={styles.body}>{s3.body}</p>
          </div>
        </article>
      )}

      {/* ── 5. Text-only final section ──────────────────────────────────── */}
      {s4 && (
        <article className={styles.block}>
          <h2 className={styles.h2}>{s4.heading}</h2>
          <p className={styles.body}>{s4.body}</p>
        </article>
      )}
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
