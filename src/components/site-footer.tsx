"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/links";

const SUPPORTED_GAMES = [
  { name: "Accounts",           slug: "accounts" },
  { name: "Apex Legends",       slug: "apex" },
  { name: "ARC Raiders",        slug: "arc-raiders" },
  { name: "Call of Duty",       slug: "call-of-duty" },
  { name: "Counter Strike 2",   slug: "counter-strike-2" },
  { name: "Delta Force",        slug: "delta-force" },
  { name: "Escape From Tarkov", slug: "escape-from-tarkov" },
  { name: "FiveM",              slug: "fivem" },
  { name: "Fortnite",           slug: "fortnite" },
  { name: "HWID Spoofer",       slug: "hwid-spoofers" },
  { name: "Lag Switches",       slug: "lag-switches" },
  { name: "League of Legends",  slug: "lol" },
  { name: "Rainbow Six Siege",  slug: "rainbow-six-siege" },
  { name: "Roblox",             slug: "roblox" },
  { name: "Rocket League",      slug: "rocket-league" },
  { name: "Rust",               slug: "rust" },
  { name: "Valorant",           slug: "valorant" },
  { name: "VPNs",               slug: "vpns" },
];

const third = Math.ceil(SUPPORTED_GAMES.length / 3);
const GAMES_COL_1 = SUPPORTED_GAMES.slice(0, third);
const GAMES_COL_2 = SUPPORTED_GAMES.slice(third, third * 2);
const GAMES_COL_3 = SUPPORTED_GAMES.slice(third * 2);

const IMPORTANT_LINKS = [
  { label: "Support",          href: DISCORD_INVITE_URL, external: true },
  { label: "FAQ",              href: "/faq" },
  { label: "Contact Us",       href: "/contact-us" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy",   href: "/privacy-policy" },
];

export function SiteFooter() {
  return (
    <footer className="global-footer">
      <div className="footer-shell">
        <div className="footer-columns">

          {/* ── Brand column ── */}
          <article>
            <div className="footer-brand">
              <img
                src="/branding/cp-logo.png"
                alt="CheatParadise logo"
                loading="lazy"
                decoding="async"
              />
              <h3>CheatParadise</h3>
            </div>

            <div className="footer-brand-social">
              {/* Discord join button */}
              <a
                href="https://discord.gg/Qp5qrCAEry"
                target="_blank"
                rel="noreferrer"
                className="footer-discord-join"
              >
                <img src="/social/discord.png" alt="Discord" loading="lazy" decoding="async" />
                <div className="footer-discord-join-text">
                  <span className="footer-discord-join-title">Discord</span>
                  <span className="footer-discord-join-sub">Join our Community</span>
                </div>
              </a>

              {/* Social pills */}
              <div className="footer-social-row">
                <a
                  href="https://www.tiktok.com/@cheat_paradise"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="footer-social-btn"
                >
                  <img src="/social/tiktok.png" alt="TikTok" loading="lazy" decoding="async" />
                  TikTok
                </a>
                <a
                  href="https://www.youtube.com/@lllarp"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube channel"
                  className="footer-social-btn"
                >
                  <img src="/social/youtube.png" alt="YouTube" loading="lazy" decoding="async" />
                  YouTube
                </a>
              </div>
            </div>
          </article>

          {/* ── Supported Games column ── */}
          <article className="footer-categories-col">
            <h4>Supported Games</h4>
            <div className="footer-category-lists">
              <ul>
                {GAMES_COL_1.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/categories?slug=${g.slug}`}>{g.name}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {GAMES_COL_2.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/categories?slug=${g.slug}`}>{g.name}</Link>
                  </li>
                ))}
              </ul>
              <ul>
                {GAMES_COL_3.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/categories?slug=${g.slug}`}>{g.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* ── Important Links column ── */}
          <article className="footer-legal-col">
            <h4>Important Links</h4>
            <ul>
              {IMPORTANT_LINKS.map((item) =>
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

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CheatParadise. All Rights Reserved.</p>
          <p></p>
          <p>
            <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "none" }}>
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms-of-service" style={{ color: "inherit", textDecoration: "none" }}>
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
