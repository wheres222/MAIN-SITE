import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface InfoSection {
  heading: string;
  /**
   * ReactNode rather than string so a paragraph can contain a real anchor.
   * The blog's "see the current lineup" pointer used to print the category
   * path as plain text, which meant no editorial page linked to any category
   * page and none of them passed a crawlable link.
   */
  body: React.ReactNode[];
}

interface InfoPageProps {
  title: string;
  subtitle: string;
  sections: InfoSection[];
  jsonLd?: object;
  /**
   * Long-form editorial block rendered below the sections.
   *
   * The pages built on InfoPage were the thinnest on the site — /contact-us
   * shipped 149 rendered words — and Google declined to index them for it.
   */
  seo?: React.ReactNode;
}

export function InfoPage({ title, subtitle, sections, jsonLd, seo }: InfoPageProps) {
  return (
    <div className="marketplace-page">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SiteHeader activeTab="none" />

      <main className="shell info-page">
        <nav className="breadcrumb-row" aria-label="Breadcrumb">
          <Link href="/" className="crumb crumb-link">
            Home
          </Link>
          <span className="crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="crumb crumb-current">{title}</span>
        </nav>

        <section className="info-card">
          <h1>{title}</h1>
          <p>{subtitle}</p>

          <div className="info-sections">
            {sections.map((section) => (
              <article key={section.heading} className="info-section">
                <h2>{section.heading}</h2>
                {section.body.map((line, index) => (
                  <p key={`${section.heading}-${index}`}>{line}</p>
                ))}
              </article>
            ))}
          </div>
        </section>

        {seo}
      </main>

      <SiteFooter />
    </div>
  );
}
