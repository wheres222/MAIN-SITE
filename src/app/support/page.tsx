
import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDiscordUrl } from "@/lib/links";

export const metadata: Metadata = {
  title: "Support & FAQ",
  description:
    "Get help with Cheat Paradise orders, delivery, setup, and account issues. Browse FAQ or open a support ticket via Discord.",
  alternates: { canonical: "/support" },
};

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

type SupportIcon = "book" | "discord" | "ticket";

function SupportCtaIcon({ type }: { type: SupportIcon }) {
  if (type === "book") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="support-cta-icon">
        <path
          d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9 7h6M9 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "discord") {
    return (
      <Image
        src="/social/discord.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="support-cta-icon support-cta-icon-discord"
        style={{ filter: "brightness(0) invert(1)" }}
      />
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="support-cta-icon">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H11l-4.5 3v-3H6.5A2.5 2.5 0 0 1 4 13.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SupportPage() {
  const discordUrl = getDiscordUrl();

  const options = [
    {
      id: 1,
      title: "Read the Instructions First",
      body: "Before reaching out to support, go through the FAQ and setup guidance. Most common delivery and setup questions are already covered there.",
      cta: { label: "View Guides & Instructions", href: "#faq-section", external: false, icon: "book" as SupportIcon },
      recommended: false,
    },
    {
      id: 2,
      title: "Join Our Discord Server",
      body: "Still need help after checking guides? Join our Discord for direct staff support and ticket assistance.",
      cta: { label: "Join Discord Server", href: discordUrl, external: true, icon: "discord" as SupportIcon },
      recommended: true,
    },
    {
      id: 3,
      title: "Select the Right Support Type",
      body: "When creating your ticket make sure to select the correct category that matches your issue.",
      cta: { label: "Open Support Ticket", href: discordUrl, external: true, icon: "ticket" as SupportIcon },
      recommended: false,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="marketplace-page" style={{ background: "#0d0d0f" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader activeTab="support" />

      {/* Page header — matches the centered title/subtitle pattern used on
          /status and the landing page review/community sections. */}
      <header style={{
        paddingTop: 112,
        paddingBottom: 36,
        textAlign: "center",
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 700,
          color: "#f0f4ff",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Need Support?
        </h1>
        <p style={{
          margin: "10px 0 0",
          fontSize: "0.97rem",
          color: "#5a6478",
          fontWeight: 400,
        }}>
          Follow these steps to get the help you need.
        </p>
      </header>

      <main className="shell">
        <section style={{ marginBottom: 56 }}>
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
                  {...(option.cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <SupportCtaIcon type={option.cta.icon} />
                  <span>{option.cta.label}</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="faq-section" style={{ paddingTop: 32, paddingBottom: 72 }}>
          <header style={{ textAlign: "center", marginBottom: 32, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
            <h2 style={{
              margin: 0,
              fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
              fontWeight: 700,
              color: "#f0f4ff",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{
              margin: "10px 0 0",
              fontSize: "0.95rem",
              color: "#5a6478",
              fontWeight: 400,
              lineHeight: 1.55,
            }}>
              Find answers to the most common questions about products, delivery,
              payments, support, and account safety.
            </p>
          </header>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.q} className="faq-item">
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
