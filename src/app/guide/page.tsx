"use client";

import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// ─── Guide content ────────────────────────────────────────────────────────────
// Edit the sections array below to update guide content.
// Each section has an id, title, and content (JSX).
// ─────────────────────────────────────────────────────────────────────────────

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="guide-step">
      <div className="guide-step-num">{n}</div>
      <div className="guide-step-body">
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="guide-note">
      <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden className="guide-note-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="guide-warn">
      <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden className="guide-warn-icon">
        <path d="M12 9v4M12 17h.01M10.3 3.6L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

const SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    content: (
      <div className="guide-section-content">
        <h2>Getting Started with CheatParadise</h2>
        <p>Welcome to CheatParadise — the home of undetected, external game cheats for PC. This guide walks you through everything from creating an account to using your first product.</p>

        <h3>What is an External Cheat?</h3>
        <p>External cheats run as a separate process outside the game. They read game memory and render an overlay, which makes them significantly safer than internal (injected) cheats. All CheatParadise products are external and designed to work alongside most anti-cheat systems.</p>

        <h3>Requirements</h3>
        <ul className="guide-list">
          <li>Windows 10 or Windows 11 (64-bit)</li>
          <li>Intel or AMD CPU</li>
          <li>At least 8 GB RAM</li>
          <li>A purchased license key from CheatParadise</li>
          <li>Secure Boot <strong>disabled</strong> in BIOS (required for most products)</li>
        </ul>

        <Note>You do not need a high-end PC. External cheats have minimal performance impact — most use less than 50 MB of RAM.</Note>
      </div>
    ),
  },
  {
    id: "create-account",
    title: "Creating an Account",
    icon: "👤",
    content: (
      <div className="guide-section-content">
        <h2>Creating an Account</h2>
        <p>An account lets you track your orders, manage your balance, and access support tickets.</p>

        <Step n={1} title="Click Register">
          Hit the <strong>Register</strong> button in the top-right corner of any page. Enter a username, email, and password.
        </Step>
        <Step n={2} title="Verify your email">
          Check your inbox for a verification email and click the confirmation link. Check spam if you don&apos;t see it within 2 minutes.
        </Step>
        <Step n={3} title="Log in">
          Click <strong>Login</strong> and enter your credentials. You&apos;ll be redirected to the store.
        </Step>

        <Note>You can also register and log in with <strong>Discord</strong> for a faster experience.</Note>
      </div>
    ),
  },
  {
    id: "purchasing",
    title: "Buying a Product",
    icon: "💳",
    content: (
      <div className="guide-section-content">
        <h2>Buying a Product</h2>
        <p>All orders are processed through our secure payment gateway and delivered instantly after payment confirmation.</p>

        <Step n={1} title="Find your product">
          Browse the store or search for your game. Select a subscription plan (Day, Week, Month, Lifetime).
        </Step>
        <Step n={2} title="Choose payment method">
          We accept major credit/debit cards, crypto, and balance. Crypto payments are processed through NOWPayments and may take 1–5 minutes to confirm.
        </Step>
        <Step n={3} title="Complete checkout">
          Enter your email (used for delivery), review your order, and confirm payment.
        </Step>
        <Step n={4} title="Receive your key">
          Your license key will be delivered to the email provided at checkout. You can also view it under <strong>Account → Orders</strong>.
        </Step>

        <Warn>Do not close the browser tab during payment. If you encounter issues, check your email before opening a support ticket — delivery can take up to 5 minutes.</Warn>
      </div>
    ),
  },
  {
    id: "installation",
    title: "Installing the Loader",
    icon: "⚙️",
    content: (
      <div className="guide-section-content">
        <h2>Installing the Loader</h2>
        <p>Every product on CheatParadise uses a dedicated loader. Follow these steps exactly to avoid issues.</p>

        <Warn>Never share your loader or key with anyone. Your key is hardware-locked to your PC. If you share it, it may be suspended.</Warn>

        <Step n={1} title="Download the loader">
          Go to <a href="/loaders" className="guide-link">CheatParadise Loaders</a> and download the loader for your product. Make sure you are downloading the latest version.
        </Step>
        <Step n={2} title="Disable Windows Defender">
          Open <strong>Windows Security → Virus &amp; threat protection → Manage settings</strong> and turn off Real-time protection. You may also need to add the loader folder to the Exclusions list.
        </Step>
        <Step n={3} title="Extract the archive">
          Right-click the downloaded .zip and select <strong>Extract All</strong>. Extract to a simple path like <code>C:\CP\</code> — avoid paths with spaces or special characters.
        </Step>
        <Step n={4} title="Run as Administrator">
          Right-click the loader .exe and select <strong>Run as administrator</strong>. Click Yes on the UAC prompt.
        </Step>
        <Step n={5} title="Enter your key">
          Paste your license key into the loader and click <strong>Launch</strong>. The overlay will appear once the game is running.
        </Step>

        <Note>If the loader closes immediately, your antivirus may still be blocking it. Ensure Windows Defender exclusions are set correctly and re-download the loader.</Note>
      </div>
    ),
  },
  {
    id: "bios-setup",
    title: "BIOS Setup",
    icon: "🖥️",
    content: (
      <div className="guide-section-content">
        <h2>BIOS Setup</h2>
        <p>Some products require specific BIOS settings to function. Incorrect BIOS configuration is the most common cause of loader failures.</p>

        <h3>Disable Secure Boot</h3>
        <Step n={1} title="Enter BIOS">
          Restart your PC and press <strong>DEL</strong>, <strong>F2</strong>, or <strong>F12</strong> during boot (depends on your motherboard brand) to enter BIOS.
        </Step>
        <Step n={2} title="Find Secure Boot">
          Navigate to <strong>Boot → Secure Boot</strong> or <strong>Security → Secure Boot</strong>. Set it to <strong>Disabled</strong>.
        </Step>
        <Step n={3} title="Save and exit">
          Press <strong>F10</strong> to save changes and exit. Windows will boot normally.
        </Step>

        <h3>Disable TPM (if required)</h3>
        <p>Some products also require TPM to be disabled. Find <strong>Security → TPM Device</strong> and set it to <strong>Disabled</strong>.</p>

        <Warn>Disabling Secure Boot may cause BitLocker to prompt for a recovery key on some devices. Suspend BitLocker before making BIOS changes if applicable.</Warn>
      </div>
    ),
  },
  {
    id: "game-specific",
    title: "Game-Specific Guides",
    icon: "🎮",
    content: (
      <div className="guide-section-content">
        <h2>Game-Specific Guides</h2>

        <h3>Rust</h3>
        <ul className="guide-list">
          <li>Launch Rust via Steam. Do <strong>not</strong> use the EAC bypass version.</li>
          <li>Run the loader as admin, enter your key, then alt-tab back into Rust.</li>
          <li>The overlay keybind is <strong>INSERT</strong> by default.</li>
          <li>Adjust ESP render distance in the settings — high values can cause FPS drops.</li>
        </ul>

        <h3>Valorant</h3>
        <ul className="guide-list">
          <li>Launch the loader <strong>before</strong> opening Valorant.</li>
          <li>Vanguard must be running. If it&apos;s not, restart your PC.</li>
          <li>Do not inject during champion select — wait for the agent lock-in screen.</li>
          <li>Recommended: reduce aimbot smoothness to 8–12 for a more natural look.</li>
        </ul>

        <h3>Apex Legends</h3>
        <ul className="guide-list">
          <li>Launch the loader before starting the game.</li>
          <li>EAC is active — only use features listed as EAC-safe in your product description.</li>
          <li>Avoid toggling the cheat in lobbies with streamers or high-rank players.</li>
        </ul>

        <h3>CS2</h3>
        <ul className="guide-list">
          <li>CS2 uses VAC3. Do not use any paid or community servers with the cheat active.</li>
          <li>Stick to Faceit or Casual/Deathmatch only.</li>
          <li>Run the loader as admin before launching Steam.</li>
        </ul>

        <h3>Escape From Tarkov</h3>
        <ul className="guide-list">
          <li>EFT uses BattlEye. Launch the loader before EFT.</li>
          <li>Enter your key, click Launch, then start EFT via the launcher.</li>
          <li>Never use rage settings in PvP raids — only use safe ESP.</li>
        </ul>

        <Note>Game-specific guides are updated with each major game patch. If your game just updated, check Discord for any temporary status changes before launching.</Note>
      </div>
    ),
  },
  {
    id: "safety",
    title: "Staying Undetected",
    icon: "🛡️",
    content: (
      <div className="guide-section-content">
        <h2>Staying Undetected</h2>
        <p>While our products are built to evade anti-cheat systems, your behaviour in-game is the biggest risk factor. Follow these guidelines to minimize detection risk.</p>

        <h3>Settings</h3>
        <ul className="guide-list">
          <li>Use smooth aimbot settings (smoothness 8–15). Snapping is obvious to spectators and anti-cheat.</li>
          <li>Do not use 100% bone lock. Target chest, not head, for humanized behaviour.</li>
          <li>Enable FOV limits (40–60 FOV is realistic).</li>
          <li>Limit visibility checks — only engage targets you could realistically see.</li>
        </ul>

        <h3>Behaviour</h3>
        <ul className="guide-list">
          <li>Do not drop massive kill/damage numbers. Stay within 10–20% of your normal stats.</li>
          <li>Avoid looting items you couldn&apos;t have known were there.</li>
          <li>Don&apos;t pre-aim corners before the enemy is visible in a natural way.</li>
          <li>Take intentional losses or missed shots occasionally.</li>
        </ul>

        <h3>Account Safety</h3>
        <ul className="guide-list">
          <li>Use a smurfed account for risky settings, not your main.</li>
          <li>Never screenshot or record your screen with the cheat visible.</li>
          <li>Do not share your key — it is hardware-locked and linked to your account.</li>
          <li>If you get HWID banned, purchase a new key and use an <a href="/categories?slug=hwid-spoofers" className="guide-link">HWID Spoofer</a> before relaunching.</li>
        </ul>

        <Warn>No cheat is permanently undetectable. Anti-cheat software is constantly updated. Always check the Status page before launching after a game update.</Warn>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: "🔧",
    content: (
      <div className="guide-section-content">
        <h2>Troubleshooting</h2>
        <p>Most issues can be solved by following these steps in order.</p>

        <h3>Loader closes immediately</h3>
        <ul className="guide-list">
          <li>Windows Defender or antivirus is deleting the file. Add the folder to exclusions and re-download.</li>
          <li>Run as Administrator.</li>
          <li>Ensure Secure Boot is disabled in BIOS.</li>
        </ul>

        <h3>Key says "already in use" or "invalid"</h3>
        <ul className="guide-list">
          <li>Each key is hardware-locked. If you changed your hardware, open a support ticket to get it reset.</li>
          <li>Double-check there are no extra spaces when pasting your key.</li>
          <li>If you just purchased, wait 2 minutes and try again — delivery can be slightly delayed.</li>
        </ul>

        <h3>Overlay not showing in game</h3>
        <ul className="guide-list">
          <li>Make sure you launched the loader <strong>before</strong> the game.</li>
          <li>Press <strong>INSERT</strong> to toggle the overlay — it may be hidden.</li>
          <li>Run the game in Borderless Windowed mode, not Fullscreen Exclusive.</li>
        </ul>

        <h3>Game crashes after injecting</h3>
        <ul className="guide-list">
          <li>Check the Status page — the product may be temporarily detected after a game update.</li>
          <li>Verify game file integrity through Steam/launcher.</li>
          <li>Try a clean Windows restart before launching.</li>
        </ul>

        <h3>I was banned</h3>
        <ul className="guide-list">
          <li>If you receive a ban, do <strong>not</strong> launch the cheat again on that account.</li>
          <li>Purchase an <a href="/categories?slug=hwid-spoofers" className="guide-link">HWID Spoofer</a> before creating a new account.</li>
          <li>Review the Safety section and adjust your settings on the new account.</li>
        </ul>

        <Note>Still stuck? Open a support ticket in <a href="/support" className="guide-link">Discord</a> and include: your order ID, loader version, Windows version, and a screenshot of the error.</Note>
      </div>
    ),
  },
  {
    id: "hwid-spoofer",
    title: "HWID Spoofer Guide",
    icon: "🔀",
    content: (
      <div className="guide-section-content">
        <h2>HWID Spoofer Guide</h2>
        <p>If you have received a hardware ban (HWID ban), you will need to spoof your hardware identifiers before creating a new game account.</p>

        <Warn>Do not attempt to rejoin the game with a new account before spoofing. HWID bans target your hardware, not your account.</Warn>

        <Step n={1} title="Purchase a spoofer">
          Go to <a href="/categories?slug=hwid-spoofers" className="guide-link">HWID Spoofers</a> and purchase the appropriate spoofer for your game.
        </Step>
        <Step n={2} title="Download and run">
          Download from the <a href="/loaders" className="guide-link">Loaders page</a>. Run as admin. The spoofer will randomize your hardware IDs.
        </Step>
        <Step n={3} title="Create a new game account">
          After spoofing, create a completely new account — new email, new payment method, new username. Do not link to your previous account in any way.
        </Step>
        <Step n={4} title="Start fresh">
          Install the game on the new account. Re-purchase a cheat license if needed. Start with conservative settings.
        </Step>

        <h3>What the Spoofer Changes</h3>
        <ul className="guide-list">
          <li>Hard drive serial numbers</li>
          <li>MAC address</li>
          <li>BIOS/UEFI identifiers</li>
          <li>GPU device ID</li>
          <li>CPU identifiers</li>
        </ul>

        <Note>Some games (Valorant, EFT) use deep HWID checks. For these games, a spoofer session must be active every time you launch the game on the new account.</Note>
      </div>
    ),
  },
];

export default function GuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const activeSection = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <main className="guide-shell">
        {/* Sidebar */}
        <aside className="guide-sidebar">
          <div className="guide-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden className="guide-sidebar-icon">
              <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 7h6M9 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>Setup Guide</span>
          </div>
          <nav className="guide-nav">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`guide-nav-item ${activeId === section.id ? "guide-nav-active" : ""}`}
                onClick={() => setActiveId(section.id)}
              >
                <span className="guide-nav-emoji" aria-hidden>{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>

          <div className="guide-sidebar-footer">
            <a href="/support" className="guide-support-link">
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <path d="M4.8 13.2a7.2 7.2 0 1 1 14.4 0v4.1a2.2 2.2 0 0 1-2.2 2.2h-.6a2.2 2.2 0 0 1-2.2-2.2v-3a2.2 2.2 0 0 1 2.2-2.2h2.2M7.6 12.1H6.4a2.2 2.2 0 0 0-2.2 2.2v3a2.2 2.2 0 0 0 2.2 2.2h.6a2.2 2.2 0 0 0 2.2-2.2v-3a2.2 2.2 0 0 0-1.6-2.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open Support Ticket
            </a>
          </div>
        </aside>

        {/* Content */}
        <article className="guide-content">
          <div className="guide-breadcrumb">
            <span>Guide</span>
            <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{activeSection.title}</span>
          </div>
          <div key={activeId}>
            {activeSection.content}
          </div>

          {/* Prev / next navigation */}
          <div className="guide-pagination">
            {SECTIONS.findIndex((s) => s.id === activeId) > 0 && (
              <button
                type="button"
                className="guide-page-btn guide-page-prev"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeId);
                  setActiveId(SECTIONS[idx - 1].id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) - 1].title}
              </button>
            )}
            {SECTIONS.findIndex((s) => s.id === activeId) < SECTIONS.length - 1 && (
              <button
                type="button"
                className="guide-page-btn guide-page-next"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeId);
                  setActiveId(SECTIONS[idx + 1].id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) + 1].title}
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </article>
      </main>

      <style>{`
        .guide-shell {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: calc(100vh - 64px);
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px 80px;
          gap: 0;
        }

        /* ── Sidebar ── */
        .guide-sidebar {
          position: sticky;
          top: 24px;
          height: fit-content;
          padding: 24px 0;
          border-right: 1px solid #1e2232;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .guide-sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #5272a8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #1e2232;
          margin-bottom: 8px;
        }
        .guide-sidebar-icon { color: #2563eb; }

        .guide-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 8px;
          flex: 1;
        }
        .guide-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: none;
          background: transparent;
          color: #7a8899;
          font-size: 0.88rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.12s, color 0.12s;
          width: 100%;
        }
        .guide-nav-item:hover { background: rgba(255,255,255,0.04); color: #c8d3ea; }
        .guide-nav-active { background: rgba(37,99,235,0.12) !important; color: #60a5fa !important; font-weight: 600; }
        .guide-nav-emoji { font-size: 1rem; line-height: 1; }

        .guide-sidebar-footer {
          padding: 16px 16px 0;
          border-top: 1px solid #1e2232;
          margin-top: 16px;
        }
        .guide-support-link {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.82rem;
          color: #5272a8;
          text-decoration: none;
          transition: color 0.12s;
        }
        .guide-support-link:hover { color: #60a5fa; }

        /* ── Content ── */
        .guide-content {
          padding: 32px 0 0 48px;
          min-width: 0;
        }
        .guide-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #5272a8;
          margin-bottom: 24px;
        }

        .guide-section-content h2 {
          margin: 0 0 12px;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          color: #f0f4ff;
          letter-spacing: -0.02em;
        }
        .guide-section-content h3 {
          margin: 28px 0 10px;
          font-size: 1rem;
          font-weight: 700;
          color: #c8d3ea;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .guide-section-content p {
          margin: 0 0 16px;
          color: #8a96b2;
          line-height: 1.7;
          font-size: 0.95rem;
        }
        .guide-section-content code {
          background: #1a1b20;
          border: 1px solid #2a3040;
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 0.88em;
          color: #7cc4ff;
          font-family: monospace;
        }
        .guide-link { color: #60a5fa; text-decoration: underline; text-underline-offset: 3px; }

        .guide-list {
          margin: 0 0 16px;
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .guide-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #8a96b2;
          font-size: 0.93rem;
          line-height: 1.6;
          padding-left: 0;
        }
        .guide-list li::before {
          content: '';
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
          margin-top: 7px;
        }
        .guide-list strong { color: #d0d8e8; }

        /* Step */
        .guide-step {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .guide-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #2563eb;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .guide-step-body strong {
          display: block;
          color: #d0d8e8;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }
        .guide-step-body div {
          color: #8a96b2;
          font-size: 0.92rem;
          line-height: 1.6;
        }

        /* Note / Warn */
        .guide-note, .guide-warn {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.87rem;
          line-height: 1.55;
          margin: 16px 0;
        }
        .guide-note { background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); color: #93b4e8; }
        .guide-warn { background: rgba(234,179,8,0.07); border: 1px solid rgba(234,179,8,0.22); color: #d4b83a; }
        .guide-note-icon { color: #2563eb; flex-shrink: 0; margin-top: 1px; }
        .guide-warn-icon { color: #d4b83a; flex-shrink: 0; margin-top: 1px; }

        /* Pagination */
        .guide-pagination {
          display: flex;
          gap: 12px;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #1e2232;
          justify-content: space-between;
        }
        .guide-page-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: 1px solid #242833;
          background: #1a1b20;
          color: #c8d3ea;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .guide-page-btn:hover { border-color: #2563eb; background: rgba(37,99,235,0.08); }
        .guide-page-next { margin-left: auto; }

        @media (max-width: 860px) {
          .guide-shell {
            grid-template-columns: 1fr;
            padding: 0 16px 60px;
          }
          .guide-sidebar {
            position: static;
            border-right: none;
            border-bottom: 1px solid #1e2232;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .guide-nav { flex-direction: row; flex-wrap: wrap; }
          .guide-content { padding: 0; }
        }
      `}</style>

      <SiteFooter />
    </div>
  );
}
