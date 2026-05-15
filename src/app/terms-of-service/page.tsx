
import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Cheat Paradise terms of service — usage rules, license terms, disclaimers, and policies for our digital storefront.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle="Last updated: May 2025. By accessing or using Cheat Paradise you agree to be bound by these terms in full."
      sections={[
        {
          heading: "1. Acceptance of Terms",
          body: [
            "By visiting, browsing, or making a purchase on Cheat Paradise ('the Site', 'we', 'us'), you confirm that you have read, understood, and agree to be legally bound by these Terms of Service and all policies linked herein, including our Refund Policy and Privacy Policy.",
            "If you do not agree to any part of these terms, you must discontinue use of the Site immediately. We reserve the right to update these terms at any time without prior notice. Continued use of the Site following any changes constitutes your acceptance of those changes.",
          ],
        },
        {
          heading: "2. Eligibility",
          body: [
            "You must be at least 18 years of age, or the age of legal majority in your jurisdiction, to use this Site and purchase products. By placing an order, you represent and warrant that you meet this requirement.",
            "Use of this Site is void where prohibited by law. It is your sole responsibility to determine whether purchasing or using the products sold here complies with the laws applicable in your country or region.",
          ],
        },
        {
          heading: "3. Products & Digital Licenses",
          body: [
            "Cheat Paradise sells digital software products delivered electronically. All purchases grant you a limited, personal, non-exclusive, non-transferable license to use the product for its intended purpose.",
            "You may not resell, redistribute, sublicense, share, lease, or otherwise transfer any product or license key obtained through this Site. Any such activity constitutes a material breach of these terms and will result in immediate account termination with no refund.",
            "Products are provided 'as-is' for personal use only. We make no guarantees regarding compatibility with specific game versions, operating systems, or third-party software unless explicitly stated on the product listing.",
          ],
        },
        {
          heading: "4. Risk Acknowledgment",
          body: [
            "The software products sold on this Site are intended for use with video games. The use of third-party software with online games may violate the game publisher's End User License Agreement (EULA) and may result in consequences including, but not limited to, temporary or permanent suspension of your game account, hardware bans, or other penalties imposed by the game developer or anti-cheat provider.",
            "You acknowledge and accept all risks associated with the use of our products, including the risk of game account bans. Cheat Paradise is not responsible for any game bans, account suspensions, or other penalties you receive as a result of using our products.",
            "We strongly recommend reviewing the terms and policies of any game before using third-party software.",
          ],
        },
        {
          heading: "5. Account Responsibilities",
          body: [
            "You are responsible for maintaining the confidentiality of your account credentials. Any activity that occurs under your account is your responsibility, regardless of whether it was authorised by you.",
            "You agree to notify us immediately of any unauthorised access to or use of your account. We will not be liable for any loss or damage arising from your failure to keep your credentials secure.",
            "We reserve the right to suspend or terminate any account that we reasonably believe is being used fraudulently, abusively, or in violation of these terms.",
          ],
        },
        {
          heading: "6. Prohibited Conduct",
          body: [
            "You agree not to use the Site or its products in any way that is unlawful, harmful, fraudulent, or deceptive. Prohibited conduct includes, but is not limited to: attempting to reverse-engineer, decompile, or disassemble any product; using automated tools to scrape or interact with the Site; creating fraudulent orders or chargebacks; sharing or publicly distributing any purchased license or key; and impersonating staff or other users.",
            "Any violation of this section may result in immediate account termination, permanent ban from all services, and where appropriate, referral to law enforcement authorities.",
          ],
        },
        {
          heading: "7. Intellectual Property",
          body: [
            "All content on this Site — including text, graphics, logos, product names, and software — is the property of Cheat Paradise or its respective licensors and is protected by applicable intellectual property laws.",
            "Nothing in these terms grants you any right, title, or interest in any intellectual property owned by or licensed to Cheat Paradise beyond the limited use licence described in Section 3.",
          ],
        },
        {
          heading: "8. No Warranty",
          body: [
            "To the fullest extent permitted by law, Cheat Paradise provides all products and services on an 'as-is' and 'as-available' basis without any warranty of any kind, express or implied. We do not warrant that products will be uninterrupted, error-free, undetected by anti-cheat systems, or fit for any particular purpose.",
            "We do not guarantee that any product will remain functional following game updates, patches, or anti-cheat system changes. Product availability and functionality may change without notice.",
          ],
        },
        {
          heading: "9. Limitation of Liability",
          body: [
            "To the maximum extent permitted by applicable law, Cheat Paradise and its owners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of, or inability to use, the Site or any product — including but not limited to loss of game account, loss of in-game items or progress, or any other game-related consequences.",
            "Our total cumulative liability to you for any claims arising under these terms shall not exceed the amount you paid for the specific product giving rise to the claim.",
          ],
        },
        {
          heading: "10. Termination",
          body: [
            "We may suspend or permanently terminate your access to the Site and any associated services at our sole discretion, at any time, with or without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.",
            "Upon termination, any licenses granted to you will immediately cease. Sections covering disclaimers, limitations of liability, and dispute resolution shall survive termination.",
          ],
        },
        {
          heading: "11. Modifications",
          body: [
            "We reserve the right to modify, update, or replace any part of these Terms of Service at any time. Changes take effect immediately upon posting to the Site. It is your responsibility to check these terms periodically. Your continued use of the Site after changes are posted constitutes your acceptance of the revised terms.",
          ],
        },
        {
          heading: "12. Governing Law",
          body: [
            "These Terms of Service shall be governed by and construed in accordance with applicable law. Any disputes arising under these terms shall be resolved through good-faith negotiation in the first instance. If a resolution cannot be reached, disputes shall be subject to binding arbitration.",
          ],
        },
        {
          heading: "13. Contact",
          body: [
            "If you have any questions about these Terms of Service, please reach out to our team via the Support page or join our Discord server. We aim to respond to all enquiries within 24–48 hours.",
          ],
        },
      ]}
    />
  );
}
