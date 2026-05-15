import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DISCORD_INVITE_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Editorial Team & Methodology",
  description:
    "Meet the Cheat Paradise editorial team — who tests, writes, and verifies every cheat we sell, and the methodology behind every undetected rating.",
  alternates: { canonical: "/about/editorial-team" },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Cheat Paradise Editorial Team",
  alternateName: "CP Editor",
  jobTitle: "Lead Editor & Cheat Verification Specialist",
  description:
    "The Cheat Paradise editorial team has been testing, verifying, and writing about game cheats and anti-cheat systems since 2022. The team holds extensive hands-on experience with EAC, BattlEye, Vanguard, and Epic's anti-cheat implementations across Rust, Fortnite, Rainbow Six Siege, ARC Raiders, and other major titles.",
  worksFor: {
    "@type": "Organization",
    name: "Cheat Paradise",
    url: siteUrl,
  },
  url: `${siteUrl}/about/editorial-team`,
  sameAs: [DISCORD_INVITE_URL, "https://www.youtube.com/@franprado"],
  knowsAbout: [
    "EasyAntiCheat",
    "BattlEye Anti-Cheat",
    "Riot Vanguard",
    "HWID Spoofing",
    "Game Memory Reading",
    "External Cheat Development",
    "Anti-Cheat Bypass Techniques",
  ],
};

export default function EditorialTeamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="marketplace-page" style={{ background: "#0d0d0f" }}>
        <SiteHeader activeTab="none" />

        <main
          style={{
            maxWidth: 880,
            margin: "0 auto",
            padding: "112px 24px 80px",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.7,
          }}
        >
          <header style={{ marginBottom: 36 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                fontWeight: 700,
                color: "#f0f4ff",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Editorial Team & Methodology
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "1rem",
                color: "#5a6478",
              }}
            >
              Who tests, writes, and verifies every cheat sold on Cheat Paradise.
            </p>
          </header>

          <Section title="Who writes this site">
            <p>
              The Cheat Paradise editorial team has been actively testing, verifying,
              and documenting third-party game software since 2022. Every product
              listing, comparison guide, and detection report on this site is written
              by a team member who has personally tested the product against the
              current build of the game's anti-cheat system.
            </p>
            <p>
              We do not publish AI-generated content without human verification, and
              we do not write reviews of products we haven't tested ourselves. When
              a cheat we sell becomes detected, we say so on the product page and
              pause sales until a working build is verified — not the other way
              around.
            </p>
          </Section>

          <Section title="Areas of expertise">
            <ul style={{ paddingLeft: 18 }}>
              <li>EasyAntiCheat (EAC) detection patterns and bypass survival</li>
              <li>BattlEye kernel-level scanning and HWID-based bans</li>
              <li>Riot Vanguard and equivalent kernel anti-cheats</li>
              <li>Game memory reading via external processes</li>
              <li>HWID spoofer compatibility and limitations</li>
              <li>Stream-proof overlay rendering (OBS, Discord, Shadowplay)</li>
              <li>Patch cycle monitoring across Rust force-wipes, Fortnite chapter resets, R6 Siege seasons, and ARC Raiders weekly updates</li>
            </ul>
          </Section>

          <Section title="How we verify a cheat is 'undetected'">
            <p>
              Before a product is listed for sale on Cheat Paradise — and after every
              game patch — a team member runs the cheat on a test account through a
              standard verification routine:
            </p>
            <ol style={{ paddingLeft: 18 }}>
              <li>Fresh install on a clean Windows environment</li>
              <li>HWID spoofer applied per product documentation</li>
              <li>Test account joins a live game session and uses every advertised feature for at least 30 minutes</li>
              <li>Account monitored for 72 hours post-test for delayed bans or shadow flags</li>
              <li>Test repeated on each game patch within 4 hours of release</li>
            </ol>
            <p>
              If any step fails, the product is pulled from sale and active
              subscribers are notified via Discord and email. We never let a flagged
              loader stay live for revenue.
            </p>
          </Section>

          <Section title="Editorial independence">
            <p>
              We sell software from multiple independent developers. Our editorial
              guidance — which products to recommend, which features matter most for
              a given game, and which competitor cheats are worth comparing against —
              is independent of vendor relationships. Vendors do not pay for
              favourable placement on this site.
            </p>
          </Section>

          <Section title="Contact the editorial team">
            <p>
              Tips, corrections, and detection reports go to{" "}
              <a
                href="mailto:cheatparadisesupport@gmail.com"
                style={{ color: "var(--accent, #00a6ff)" }}
              >
                cheatparadisesupport@gmail.com
              </a>
              , or join our{" "}
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent, #00a6ff)" }}
              >
                Discord
              </a>{" "}
              and message a staff member directly. We respond within 24 hours on
              weekdays.
            </p>
          </Section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "1.2rem",
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: "0.95rem" }}>{children}</div>
    </section>
  );
}
