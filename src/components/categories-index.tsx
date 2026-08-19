import Link from "next/link";
import { allGameSeoSlugs, gameSeoContentFor } from "@/lib/game-seo-content";
import { categoryHref } from "@/lib/category-href";
import styles from "./categories-index.module.css";

/**
 * The /categories index.
 *
 * This URL is in the sitemap and in every breadcrumb trail, and it used to
 * render "Missing category link" — the component behind it only handled the
 * legacy ?slug= form, so the plain URL was a dead page serving 14 words and no
 * H1. Google filed it under Soft 404, which is what it was.
 *
 * A server component on purpose: the point is that the links are in the HTML.
 * It is also the cheapest internal-linking win on the site — one indexed page
 * pointing at all sixteen category pages, several of which currently have no
 * inbound internal link at all.
 */
export function CategoriesIndex() {
  const categories = allGameSeoSlugs()
    .map((slug) => {
      const content = gameSeoContentFor(slug);
      return content ? { slug, content } : null;
    })
    .filter((entry): entry is { slug: string; content: NonNullable<ReturnType<typeof gameSeoContentFor>> } => entry !== null)
    .sort((a, b) => a.content.displayName.localeCompare(b.content.displayName));

  return (
    <section className={styles.wrap} aria-labelledby="categories-heading">
      <header className={styles.head}>
        <h1 id="categories-heading" className={styles.h1}>
          Game Cheat Categories
        </h1>
        <p className={styles.lead}>
          Every game we stock, with what the cheats actually do on each one and how
          that game&apos;s anti-cheat behaves. {categories.length} guides — pick a game
          to see the products, live detection status and the setup notes specific to it.
        </p>
      </header>

      <ul className={styles.grid}>
        {categories.map(({ slug, content }) => (
          <li key={slug} className={styles.card}>
            <Link href={categoryHref(slug)} className={styles.cardLink}>
              <span className={styles.cardName}>{content.displayName}</span>
              <span className={styles.cardMeta}>{content.lastTested}</span>
            </Link>
            <p className={styles.cardDesc}>{content.metaDescription}</p>
          </li>
        ))}
      </ul>

      <footer className={styles.foot}>
        <p className={styles.footText}>
          Looking for a specific product rather than a game?{" "}
          <Link href="/products">Browse the full catalogue</Link>, check{" "}
          <Link href="/status">live detection status</Link>, or read the{" "}
          <Link href="/blog">guides</Link> on how anti-cheat detection works and what
          actually gets accounts banned.
        </p>
      </footer>
    </section>
  );
}
