import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDiscordUrl } from "@/lib/links";

const faqs = [
  {
    q: "How can I trust CheatParadise?",
    a: "Start with our Reviews page and community feedback in Discord. We keep product statuses, support channels, and delivery flow transparent so you can verify service quality before buying.",
  },
  {
    q: "What is the refund policy?",
    a: "Refunds are reviewed case-by-case based on product type, delivery status, and usage. Open a support ticket with your order ID and we will guide you through the correct next step.",
  },
  {
    q: "How long does delivery take after payment?",
    a: "Most orders are delivered instantly after successful payment confirmation. In rare payment verification cases, it can take a few extra minutes before access is issued.",
  },
  {
    q: "Can I become a media/content creator partner?",
    a: "Yes. Reach out through Discord support with your channel links, audience stats, and platform details. Our team reviews creator requests and follows up with partnership options.",
  },
  {
    q: "Are your cheats undetected?",
    a: "Products are maintained with regular updates and security-focused development. No product can guarantee permanent undetection, so always follow setup guidance and safe-use recommendations.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Accepted methods are shown during checkout and may include cards, wallets, and crypto depending on your region. The checkout page always shows the latest available options.",
  },
  {
    q: "Is my personal data safe?",
    a: "We only collect what is required for billing, delivery, and support. Sensitive payment handling is processed through secure providers, and you can request help with account/privacy concerns anytime.",
  },
  {
    q: "Where and how can I get support?",
    a: "Use the Support page route first for the fastest triage, then open a Discord ticket for direct staff help. Include your order ID and issue details so we can resolve your case quickly.",
  },
];

export default function SupportPage() {
  const discordUrl = getDiscordUrl();

  const options = [
    {
      id: 1,
      title: "Read the Instructions First",
      body: "Before reaching out to support, go through the FAQ and setup guidance. Most common delivery and setup questions are already covered there.",
      cta: { label: "View Guides & Instructions", href: "#faq-section", external: false },
      recommended: false,
    },
    {
      id: 2,
      title: "Join Our Discord Server",
      body: "Still need help after checking guides? Join our Discord for direct staff support and ticket assistance.",
      cta: { label: "Join Discord Server", href: discordUrl, external: true },
      recommended: true,
    },

  ];

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="support" />

      <main className="shell subpage-wrap support-page">

        <section className="support-main-card">
          <header className="support-main-header">
            <h1>
              <span className="support-title-primary">Need</span>{" "}
              <span className="support-title-accent">Support?</span>
            </h1>
            <p>Follow these steps to get the help you need.</p>
          </header>

          <div className="support-option-grid" id="direct-support">
            {options.map((option) => (
              <article key={option.id} className="support-option-card">
                <div className="support-option-top">
                  {option.recommended ? (
                    <span className="support-recommended-pill">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="m12 3 2.3 4.7 5.2.8-3.7 3.7.9 5.2L12 14.9l-4.7 2.5.9-5.2L4.5 8.5l5.2-.8L12 3Z"
                          fill="currentColor"
                        />
                      </svg>
                      Recommended
                    </span>
                  ) : null}
                </div>
                <h3>{option.title}</h3>
                <p>{option.body}</p>
                <a
                  className={`support-option-cta ${
                    option.recommended ? "support-option-cta-primary" : "support-option-cta-secondary"
                  }`}
                  href={option.cta.href}
                  {...(option.cta.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {option.cta.label}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section" id="faq-section">
          <header className="faq-header">
            <h2 className="faq-title">
              Frequently asked <span>Questions</span>
            </h2>
            <p className="faq-subtitle">
              Find answers to the most common questions about products, delivery,
              payments, support, and account safety.
            </p>
          </header>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <details key={faq.q} className="faq-item" open={idx === 0}>
                <summary>
                  <span className="faq-question">{faq.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="m7 10 5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="faq-answer-wrap">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
