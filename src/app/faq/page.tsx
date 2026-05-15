
import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Cheat Paradise — delivery, support, payments, and more.",
  alternates: { canonical: "/faq" },
};

const FAQ_SECTIONS = [
        {
          heading: "How does delivery work?",
          body: [
            "After a successful payment, your license key is delivered instantly on the order confirmation page. You will also receive it by email. If you have an account, you can always find your keys under Account → Orders.",
          ],
        },
        {
          heading: "What payment methods do you accept?",
          body: [
            "We accept major credit and debit cards (via Stripe), all major cryptocurrencies including Bitcoin, Ethereum, Solana, and USDT (via NOWPayments), and account balance top-ups. Crypto payments typically confirm within 1–5 minutes.",
          ],
        },
        {
          heading: "Will I get banned for using a cheat?",
          body: [
            "All products on CheatParadise are external and built to minimize detection risk. However, no cheat is permanently undetectable — anti-cheat software is updated constantly. We recommend following the safety guidelines in the Setup Guide, using conservative settings, and always checking the Status page before launching after a game update.",
          ],
        },
        {
          heading: "What happens if a cheat gets detected?",
          body: [
            "If a product is flagged as Detected on the Status page, do not use it. Our team works quickly to push an update. Once a fix is ready, the status returns to Undetected. You can monitor the Status page in real time or watch our Discord for update announcements.",
          ],
        },
        {
          heading: "Do you offer refunds?",
          body: [
            "Please read our full Refund Policy for details. Generally, refunds are considered if a product is in a detected state at the time of purchase and cannot be resolved within a reasonable timeframe. We do not offer refunds for user bans caused by aggressive usage.",
          ],
        },
        {
          heading: "What operating systems are supported?",
          body: [
            "All products require Windows 10 or Windows 11 (64-bit). Most products also require Secure Boot to be disabled in BIOS. See the Setup Guide → BIOS Setup section for full instructions.",
          ],
        },
        {
          heading: "How do I install the loader?",
          body: [
            "Download the loader for your product from the Loaders page. Run it as Administrator, disable Windows Defender or add the folder to exclusions, enter your license key, and click Launch. The full step-by-step process is covered in the Setup Guide.",
          ],
        },
        {
          heading: "My key says 'already in use' or 'invalid' — what do I do?",
          body: [
            "License keys are hardware-locked to your PC. If you changed your hardware (new GPU, CPU, or reinstalled Windows), the key will stop working. Open a support ticket in Discord with your order ID and we will reset it. Also double-check there are no extra spaces when pasting the key.",
          ],
        },
        {
          heading: "I was HWID banned — can I still use the cheats?",
          body: [
            "Yes. Purchase an HWID Spoofer from the store, run it before creating your new game account, and it will randomize the hardware identifiers the game uses to track bans. See the HWID Spoofer Guide section for a full walkthrough.",
          ],
        },
        {
          heading: "Can I share my license key with a friend?",
          body: [
            "No. Each key is hardware-locked to a single PC. Sharing your key will cause it to stop working on your machine. If a key is found to be shared, it may be permanently suspended without a refund.",
          ],
        },
        {
          heading: "How do I track my order?",
          body: [
            "Logged-in users can find all orders under Account → Orders. Guest customers can look up any order at the Orders page using their order ID and the tracking token sent to their email at checkout.",
          ],
        },
        {
          heading: "How do I contact support?",
          body: [
            "Support is available 24/7 through Discord ticket channels. Visit the Support page for a direct link. For business inquiries, email cheatparadisesupport@gmail.com.",
          ],
        },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SECTIONS.map((s) => ({
    "@type": "Question",
    name: s.heading,
    acceptedAnswer: {
      "@type": "Answer",
      text: s.body.join(" "),
    },
  })),
};

export default function FaqPage() {
  return (
    <InfoPage
      title="FAQ"
      subtitle="Common questions and quick answers."
      sections={FAQ_SECTIONS}
      jsonLd={faqJsonLd}
    />
  );
}
