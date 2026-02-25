import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface InfoSection {
  heading: string;
  body: string[];
}

interface InfoPageProps {
  title: string;
  subtitle: string;
  sections: InfoSection[];
}

export function InfoPage({ title, subtitle, sections }: InfoPageProps) {
  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="support" searchSlot={null} />

      <main className="shell info-page">
        <div className="breadcrumb-row">
          <div className="crumb">{title}</div>
        </div>

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
      </main>

      <SiteFooter />
    </div>
  );
}
