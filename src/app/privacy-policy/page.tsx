
import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Cheat Paradise privacy policy — how we collect, store, and protect your personal data, and what rights you have over it.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="Last updated: May 2025. This policy explains what data we collect, why we collect it, and how you can control it."
      sections={[
        {
          heading: "1. Who We Are",
          body: [
            "Cheat Paradise ('we', 'us', 'our') operates the digital storefront at this Site. This Privacy Policy applies to all visitors, registered users, and customers who interact with our Site, services, or support channels.",
            "By using the Site you consent to the practices described in this policy. If you do not agree, please discontinue use immediately.",
          ],
        },
        {
          heading: "2. Information We Collect",
          body: [
            "Account data: When you register or sign in via a third-party provider (Discord, Google), we receive the email address and profile identifier returned by that provider. We do not receive or store your social account passwords.",
            "Order data: When you make a purchase we collect the information necessary to fulfil your order, including your email address, the product purchased, the amount paid, the payment reference number, and the timestamp of the transaction.",
            "Payment data: Payment processing is handled entirely by third-party providers (NowPayments for cryptocurrency payments). We do not collect, store, or have access to raw credit card numbers, bank account details, or cryptocurrency private keys. We receive only a payment confirmation and a transaction reference.",
            "Technical data: We automatically collect certain information when you visit the Site, including your IP address, browser type and version, operating system, referring URL, pages visited, and timestamps. This data is used for security, fraud prevention, and site analytics.",
            "Communications data: If you contact support via Discord or our support page, we may retain a record of that correspondence to resolve your enquiry and improve our service.",
            "Analytics data: We use PostHog for product analytics. PostHog may collect event data such as page views, clicks, and feature interactions to help us understand how the Site is used. This data is pseudonymous and aggregated.",
          ],
        },
        {
          heading: "3. How We Use Your Information",
          body: [
            "To process and fulfil your orders, deliver purchased license keys or access credentials, and send order confirmation emails.",
            "To maintain and secure your account, detect fraudulent activity, and enforce our Terms of Service.",
            "To respond to support requests and resolve disputes.",
            "To analyse usage patterns and improve the Site's features, performance, and user experience.",
            "To comply with applicable legal obligations and respond to lawful requests from authorities.",
            "We do not sell, rent, or trade your personal information to any third party for marketing purposes.",
          ],
        },
        {
          heading: "4. Legal Bases for Processing",
          body: [
            "Contract performance: Processing your order data is necessary to fulfil the contract you enter into when making a purchase.",
            "Legitimate interests: We process technical and analytics data based on our legitimate interest in maintaining a secure, functional, and improved service.",
            "Legal obligation: Where required, we process data to comply with applicable law.",
            "Consent: Where we rely on consent (e.g. optional analytics cookies), you may withdraw consent at any time without affecting the lawfulness of prior processing.",
          ],
        },
        {
          heading: "5. Cookies and Tracking",
          body: [
            "We use essential cookies required for authentication sessions and basic site functionality. These cannot be disabled without breaking the Site.",
            "We use analytics cookies set by PostHog to track usage behaviour in a pseudonymous manner. These help us improve the product. You may opt out of analytics tracking by adjusting your browser's cookie settings or using a browser extension that blocks tracking scripts.",
            "We do not use third-party advertising cookies or sell cookie data to advertisers.",
          ],
        },
        {
          heading: "6. Third-Party Services",
          body: [
            "Supabase: We use Supabase to store account data, order records, and product status information. Supabase infrastructure is hosted on AWS. Their privacy practices can be reviewed at supabase.com/privacy.",
            "NowPayments: Cryptocurrency payment processing is handled by NowPayments. When you initiate a crypto payment, you will interact with NowPayments' infrastructure. We receive only a payment confirmation webhook. Their privacy policy is available at nowpayments.io.",
            "Discord & Google OAuth: When you choose to sign in via Discord or Google, you are subject to those platforms' respective privacy policies. We receive only the data they choose to share (typically email and user ID).",
            "PostHog: Analytics are powered by PostHog. Event data may be processed on PostHog's cloud infrastructure. Their privacy policy is available at posthog.com/privacy.",
            "Resend: Transactional emails (order confirmations, account notifications) are sent via Resend. Your email address is shared with Resend solely for this purpose.",
            "All third-party service providers are required to handle your data securely and in accordance with applicable data protection law.",
          ],
        },
        {
          heading: "7. Data Retention",
          body: [
            "Account data is retained for as long as your account remains active. If you request account deletion, we will delete or anonymise your personal data within 30 days, except where we are required to retain it by law (for example, for tax or fraud prevention purposes).",
            "Order records, including transaction references and purchase confirmations, are retained for a minimum of 3 years for financial record-keeping purposes.",
            "Support communications are retained for up to 12 months after the matter is resolved.",
            "Analytics data collected by PostHog is subject to PostHog's own retention policies.",
          ],
        },
        {
          heading: "8. Data Security",
          body: [
            "We implement appropriate technical and organisational security measures to protect your data against unauthorised access, loss, or disclosure. These measures include encrypted data transmission (TLS/HTTPS), access controls, and secure credential storage via Supabase's authentication system.",
            "No method of data transmission over the internet is completely secure. While we strive to protect your personal information, we cannot guarantee its absolute security. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify affected users as required by applicable law.",
          ],
        },
        {
          heading: "9. Your Rights",
          body: [
            "Depending on your jurisdiction, you may have the following rights regarding your personal data:",
            "Access: You may request a copy of the personal data we hold about you.",
            "Correction: You may request that inaccurate or incomplete data be corrected.",
            "Deletion: You may request the deletion of your personal data, subject to our legal retention obligations.",
            "Restriction: You may request that we restrict the processing of your data in certain circumstances.",
            "Portability: You may request a machine-readable copy of the data you provided to us.",
            "Objection: You may object to processing based on legitimate interests.",
            "To exercise any of these rights, contact us through the Support page or our Discord server. We will respond within 30 days. We may need to verify your identity before processing your request.",
          ],
        },
        {
          heading: "10. Children's Privacy",
          body: [
            "The Site is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If you believe a minor has provided us with personal information, please contact us immediately and we will take steps to delete that data.",
          ],
        },
        {
          heading: "11. International Data Transfers",
          body: [
            "Our third-party service providers may process your data in countries outside your own, including the United States and the European Union. Where data is transferred internationally, we ensure appropriate safeguards are in place — such as standard contractual clauses or reliance on adequacy decisions — to protect your data in transit.",
          ],
        },
        {
          heading: "12. Changes to This Policy",
          body: [
            "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we do, we will update the 'Last updated' date at the top of this page. Your continued use of the Site after a change is posted constitutes acceptance of the revised policy.",
            "For material changes, we will make reasonable efforts to notify registered users via email or a prominent notice on the Site.",
          ],
        },
        {
          heading: "13. Contact",
          body: [
            "If you have any questions about this Privacy Policy, wish to exercise your data rights, or have a concern about how we handle your information, please contact us through the Support page or join our Discord server. We aim to respond to all enquiries within 48 hours.",
          ],
        },
      ]}
    />
  );
}
