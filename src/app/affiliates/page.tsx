import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AFFILIATE_FACTS, AFFILIATE_TIERS, AFFILIATE_TOP_RATE } from "@/lib/affiliate-program";
import { AFFILIATE_GUIDES } from "@/lib/affiliate-guides";
import styles from "./affiliates.module.css";
import { PageSeoSections } from "@/components/page-seo-sections";
import { pageSeoFor } from "@/lib/page-seo-content";
import { jsonLd } from "@/lib/json-ld";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: `Earn up to ${AFFILIATE_TOP_RATE} of every order you refer. Tiered rates, paid to your store balance, with guides on building an audience in a restricted niche.`,
  alternates: { canonical: "/affiliates" },
};

export default function AffiliatesPage() {
  const seoContent = pageSeoFor("affiliates");
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cheat Paradise Affiliate Program",
    url: `${siteUrl}/affiliates`,
    description: `Tiered affiliate program paying up to ${AFFILIATE_TOP_RATE} of referred order value.`,
  };

  return (
    <div className="marketplace-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <SiteHeader activeTab="none" />

      <main className="shell subpage-wrap" style={{ maxWidth: 880 }}>
        <header className={styles.hero}>
          <h1 className={styles.h1}>Affiliate Program</h1>
          <p className={styles.lead}>
            Refer people to Cheat Paradise and earn a share of every order they
            place. Rates rise with the revenue you have referred, from{" "}
            {AFFILIATE_TIERS[0].kickback} up to {AFFILIATE_TOP_RATE}.
          </p>
          <Link href="/account/referrals" className={styles.cta}>
            Get your referral code
          </Link>
        </header>

        {/* The rates are stated plainly rather than framed as "up to X" alone.
            A recruitment page that oversells the rate recruits people who leave
            when they see their first payout. */}
        <section className={styles.section}>
          <h2 className={styles.h2}>Commission tiers</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Rate</th>
                  <th>Referred revenue required</th>
                </tr>
              </thead>
              <tbody>
                {AFFILIATE_TIERS.map((tier) => (
                  <tr key={tier.name}>
                    <td>{tier.name}</td>
                    <td className={styles.rate}>{tier.kickback}</td>
                    <td>
                      {tier.threshold === 0
                        ? "None — everyone starts here"
                        : `$${tier.threshold.toLocaleString()} lifetime`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            These are modest rates by affiliate standards and we would rather say
            so here than have you discover it at your first payout. The programme
            works best as a supplement for people already making content, not as
            a primary income.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>How it works</h2>
          <ul className={styles.list}>
            <li>
              Create an account and take your referral code from{" "}
              <Link href="/account/referrals" className={styles.link}>
                your referrals page
              </Link>
              .
            </li>
            <li>
              Anyone entering that code at signup is permanently attributed to
              you. {AFFILIATE_FACTS.cookieless}.
            </li>
            <li>Commission accrues as affiliate balance on every order they place.</li>
            <li>{AFFILIATE_FACTS.payout}.</li>
            <li>{AFFILIATE_FACTS.selfReferral}.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Guides</h2>
          <p className={styles.note}>
            Written to be useful whether or not you promote us.
          </p>
          <div className={styles.cards}>
            {AFFILIATE_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/affiliates/${guide.slug}`}
                className={styles.card}
              >
                <h3 className={styles.cardTitle}>{guide.title}</h3>
                <p className={styles.cardDesc}>{guide.description}</p>
                <span className={styles.cardMeta}>{guide.readingMinutes} min read</span>
              </Link>
            ))}
          </div>
        </section>
        {seoContent && <PageSeoSections content={seoContent} />}
      </main>

      <SiteFooter />
    </div>
  );
}
