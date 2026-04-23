/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance | CheatParadise",
  description: "CheatParadise is currently undergoing maintenance. We'll be back shortly.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="maint-root">
      <div className="maint-card">
        <div className="maint-brand">
          <img src="/branding/cp-logo.png" alt="CheatParadise" className="maint-logo" />
          <span className="maint-wordmark">CHEATPARADISE</span>
        </div>

        <div className="maint-badge">🔧 Under Maintenance</div>

        <h1 className="maint-title">We&apos;ll be back soon.</h1>
        <p className="maint-desc">
          We&apos;re currently making improvements to give you a better experience.
          Sit tight — CheatParadise will be back online shortly.
        </p>

        <div className="maint-divider" />

        <p className="maint-support">
          Need urgent help?{" "}
          <a
            href="https://discord.gg/6yGEKZC8aX"
            target="_blank"
            rel="noreferrer"
            className="maint-discord-link"
          >
            Join our Discord
          </a>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Montserrat:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .maint-root {
          min-height: 100vh;
          background: #0d0d0d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Roboto', sans-serif;
        }

        .maint-card {
          background: #17181d;
          border: 1px solid #222430;
          border-radius: 20px;
          padding: 56px 48px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .maint-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .maint-logo {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }

        .maint-wordmark {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          color: #ffffff;
          letter-spacing: 0.03em;
        }

        .maint-badge {
          background: rgba(124, 196, 255, 0.1);
          border: 1px solid rgba(124, 196, 255, 0.25);
          color: #7cc4ff;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 6px 16px;
          border-radius: 999px;
        }

        .maint-title {
          color: #ffffff;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .maint-desc {
          color: #8a93a8;
          font-size: 0.95rem;
          line-height: 1.65;
          max-width: 380px;
        }

        .maint-divider {
          width: 100%;
          height: 1px;
          background: #222430;
        }

        .maint-support {
          color: #6b7284;
          font-size: 0.88rem;
        }

        .maint-discord-link {
          color: #7cc4ff;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }

        .maint-discord-link:hover { color: #a8d9ff; }

        @media (max-width: 480px) {
          .maint-card { padding: 40px 24px; }
          .maint-title { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
