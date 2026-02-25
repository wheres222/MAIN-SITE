"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { toGameSlug } from "@/lib/game-slug";
import { getDiscordUrl } from "@/lib/links";

export function SiteFooter() {
  const discordUrl = getDiscordUrl();
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim() || "#";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL?.trim() || "#";
  const categories = [
    "Apex",
    "Arc Raiders",
    "Call of Duty",
    "Counter Strike 2",
    "DayZ",
    "FiveM",
    "Fortnite",
    "HWID Spoofers",
    "League of Legends",
    "PUBG",
    "Rainbow Six Siege",
    "Roblox",
    "Rust",
    "Valorant",
  ];
  const categoryLinks = categories.map((category) => ({
    label: category,
    href: `/categories/${toGameSlug(category)}`,
  }));
  const legalLinks = [
    { label: "Contact Us", href: "/contact-us" },
    { label: "Status Page", href: "/status" },
    { label: "FAQ", href: "/faq" },
    { label: "Blog", href: "/blog" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ];
  const splitIndex = Math.ceil(categories.length / 2);
  const leftCategories = categoryLinks.slice(0, splitIndex);
  const rightCategories = categoryLinks.slice(splitIndex);
  const paymentIcons = [
    { src: "/ICONS/visa-alt.svg", alt: "Visa" },
    { src: "/ICONS/mastercard.svg", alt: "Mastercard" },
    { src: "/ICONS/paypal.svg", alt: "PayPal" },
    { src: "/ICONS/apple-pay.svg", alt: "Apple Pay" },
    { src: "/ICONS/google-pay-alt.svg", alt: "Google Pay" },
    { src: "/ICONS/crypto.svg", alt: "Crypto" },
    { src: "/ICONS/ideal.svg", alt: "iDEAL" },
    { src: "/ICONS/pix.svg", alt: "Pix" },
  ];

  return (
    <footer className="global-footer">
      <div className="footer-shell footer-narrow">
        <div className="footer-columns">
          <article className="footer-brand-col">
            <div className="footer-brand">
              <img src="/branding/cp-logo.png" alt="CheatParadise logo" />
              <h3 className="footer-brand-title">
                <span className="brand-word brand-word-cheat">cheat</span>
                <span className="brand-word brand-word-paradise">paradise</span>
                <span className="brand-word brand-word-domain">.com</span>
              </h3>
            </div>
            <p className="footer-description">
              Trusted cheat provider with premium products, instant delivery, and 24/7
              support for a seamless experience. Play smarter, safer, and faster with our
              curated catalog.
            </p>
            <div className="footer-social-row">
              <a className="social-pill" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Discord">
                <img src="/social/discord.png" alt="" aria-hidden="true" className="social-icon" />
              </a>
              <a className="social-pill" href={youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
                <img src="/social/youtube.png" alt="" aria-hidden="true" className="social-icon" />
              </a>
              <a className="social-pill" href={tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok">
                <img src="/social/tiktok.png" alt="" aria-hidden="true" className="social-icon" />
              </a>
            </div>
          </article>

          <article className="footer-categories-col">
            <h4>Categories</h4>
            <div className="footer-category-lists">
              <ul>
                {leftCategories.map((category) => (
                  <li key={category.label}>
                    <Link href={category.href}>{category.label}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {rightCategories.map((category) => (
                  <li key={category.label}>
                    <Link href={category.href}>{category.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="footer-legal-col">
            <h4>Legal & Support</h4>
            <ul>
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="footer-bottom">
          <p>All Systems Operational</p>
          <p>2026 cheatparadise.com. All rights reserved.</p>
          <div className="payments">
            {paymentIcons.map((icon) => (
              <span key={icon.alt} className="payment-icon-chip">
                <img src={icon.src} alt={icon.alt} className="payment-icon" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
