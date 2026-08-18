import Link from "next/link";
import styles from "./admin-panels.module.css";

/**
 * Traffic is now measured by Vercel Analytics rather than PostHog, and Vercel
 * has no query API on the plans this project uses — the numbers live in the
 * Vercel dashboard and cannot be pulled in here.
 *
 * So this page stops pretending to be a chart. Rebuilding one against the
 * Vercel Web Analytics API would need a paid tier and an API token, and a page
 * that reports nothing is worse than a page that says where the numbers are.
 *
 * No longer a client component: there is nothing to fetch.
 */
export function AdminTrafficPanel() {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Traffic</h1>
        <p className={styles.subtitle}>
          Visitor numbers are collected by Vercel Analytics and shown in the Vercel
          dashboard. They count people with JavaScript enabled — bots, scrapers and
          scanners never appear there.
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Where the numbers are</h2>
        <p className={styles.cardBody}>
          Open your project in Vercel and pick the <strong>Analytics</strong> tab for
          visitors, page views, top pages and referrers. Google Analytics also runs on
          the site and covers the same ground with a longer history.
        </p>
        <a
          className={styles.cardLink}
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Vercel dashboard →
        </a>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>What this dashboard does cover</h2>
        <p className={styles.cardBody}>
          Client-side analytics is structurally blind to anything without JavaScript,
          which is every scanner and most bots. That traffic is recorded first-party
          instead and is the half worth watching here.
        </p>
        <Link className={styles.cardLink} href="/admin/security">
          Go to Security events →
        </Link>
      </div>
    </>
  );
}
