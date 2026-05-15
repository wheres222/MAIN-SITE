"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/links";
import { categoryHref } from "@/lib/category-href";

// Curated list of game categories shown in the footer. Mirrors what
// appears on the landing page. Edit here whenever a new game is added
// or an old one retired — the footer is intentionally static (no
// storefront fetch) so it renders correctly on every page including
// SSR-only routes where StorefrontProvider isn't wrapped.
const SUPPORTED_GAMES = [
  { name: "Accounts",          slug: "accounts" },
  { name: "Apex Legends",      slug: "apex" },
  { name: "ARC Raiders",       slug: "arc-raiders" },
  { name: "Counter Strike 2",  slug: "counter-strike-2" },
  { name: "Fortnite",          slug: "fortnite" },
  { name: "HWID Spoofer",      slug: "hwid-spoofers" },
  { name: "Rainbow Six Siege", slug: "rainbow-six-siege" },
  { name: "Rust",              slug: "rust" },
  { name: "VPNs",              slug: "vpns" },
];

// Split games into two balanced columns
const gamesHalf = Math.ceil(SUPPORTED_GAMES.length / 2);
const GAMES_COL_1 = SUPPORTED_GAMES.slice(0, gamesHalf);
const GAMES_COL_2 = SUPPORTED_GAMES.slice(gamesHalf);

const OTHER_LINKS = [
  { label: "Setup Guide",       href: "/guide" },
  { label: "Product Loaders",   href: "/loaders" },
  { label: "Product Videos",    href: "/videos" },
  { label: "Customer Support",  href: DISCORD_INVITE_URL, external: true },
  { label: "Terms of Service",  href: "/terms-of-service" },
  { label: "Refund Policy",     href: "/refund-policy" },
  { label: "Privacy Policy",    href: "/privacy-policy" },
];

export function SiteFooter() {
  return (
    <footer className="global-footer">
      <div className="footer-shell">
        <div className="footer-columns">

          {/* ── Brand column ── */}
          <article className="footer-brand-col">
            <div className="footer-brand">
              <img
                src="/branding/cp-logo.png"
                alt="CheatParadise logo"
                loading="lazy"
                decoding="async"
                className="footer-brand-logo"
              />
              <div className="footer-brand-wordmark">
                <span className="footer-brand-word-top">CHEATPARADISE</span>
              </div>
            </div>

            <p className="footer-brand-desc">
              At CheatParadise, we specialize in developing elite cheats and hacks for a
              variety of online PC games. We prioritize customer satisfaction, offering
              round-the-clock support so you never miss a beat. Ready to dominate the
              game without limits? Get started with CheatParadise today!
            </p>

            {/* Social icon squares */}
            <div className="footer-social-icons">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="footer-social-sq"
              >
                <svg viewBox="0 0 127.14 96.36" width="20" height="20" fill="currentColor" aria-hidden>
                  <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5 12.69-11.43 12.69Z"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@franprado"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="footer-social-sq"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>
                </svg>
              </a>
            </div>

            {/* Business inquiries */}
            <div className="footer-inquiry">
              <label htmlFor="footer-inquiry-email" className="footer-inquiry-label">FOR BUSINESS INQUIRIES:</label>
              <div className="footer-inquiry-input">
                <input
                  id="footer-inquiry-email"
                  type="email"
                  value="cheatparadisesupport@gmail.com"
                  readOnly
                  aria-label="Business inquiry email address"
                />
                <a href="mailto:cheatparadisesupport@gmail.com" className="footer-inquiry-send" aria-label="Send email">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                    <path d="M3 12 21 3l-4 18-4-8-10-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </article>

          {/* ── Undetected Cheats column ── */}
          <article className="footer-games-col">
            <h4>Undetected Cheats</h4>
            <div className="footer-games-lists">
              <ul>
                {GAMES_COL_1.map((g) => (
                  <li key={g.slug}>
                    <Link href={categoryHref(g.slug)}>{g.name}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {GAMES_COL_2.map((g) => (
                  <li key={g.slug}>
                    <Link href={categoryHref(g.slug)}>{g.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* ── Other Links column ── */}
          <article className="footer-links-col">
            <h4>Other Links</h4>
            <ul>
              {OTHER_LINKS.map((item) =>
                item.external ? (
                  <li key={item.label}>
                    <a href={item.href} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                )
              )}
            </ul>
          </article>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CheatParadise. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
