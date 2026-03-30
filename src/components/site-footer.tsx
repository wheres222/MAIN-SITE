"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getDiscordUrl } from "@/lib/links";

export function SiteFooter() {
  const discordUrl = getDiscordUrl();

  const rightLinks = [
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Feedback", href: "/contact-us" },
  ];

  return (
    <footer className="global-footer footer-minimal">
      <div className="footer-shell footer-minimal-shell">
        <div className="footer-minimal-row">
          <div className="footer-minimal-left">
            <div className="footer-minimal-brand">
              <img src="/branding/cp-logo.png" alt="CheatParadise logo" className="footer-minimal-logo" loading="lazy" decoding="async" />
              <h3 className="footer-minimal-title">CheatParadise</h3>
            </div>
            <p>Copyright © CheatParadise 2026. All Rights Reserved</p>
          </div>

          <div className="footer-minimal-right">
            <nav className="footer-minimal-links" aria-label="Footer links">
              {rightLinks.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <a className="footer-minimal-discord" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Discord">
              <img src="/social/discord.png" alt="" aria-hidden="true" className="social-icon" loading="lazy" decoding="async" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
