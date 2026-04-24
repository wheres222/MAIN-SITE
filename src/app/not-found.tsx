/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | CheatParadise",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="nf-root">
      <div className="nf-card">
        <Link href="/" className="nf-brand" aria-label="CheatParadise home">
          <img src="/branding/cp-logo.png" alt="CheatParadise" className="nf-logo" />
          <span className="nf-wordmark">CHEATPARADISE</span>
        </Link>

        <div className="nf-code">404</div>

        <h1 className="nf-title">Page not found</h1>
        <p className="nf-desc">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Head back to the store to find what you need.
        </p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn-primary">Back to Store</Link>
          <Link href="/support" className="nf-btn-secondary">Get Support</Link>
        </div>

        <div className="nf-divider" />

        <nav className="nf-links">
          <Link href="/status">Status</Link>
          <Link href="/guide">Setup Guide</Link>
          <Link href="/loaders">Loaders</Link>
          <Link href="/reviews">Reviews</Link>
        </nav>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nf-root {
          min-height: 100vh;
          background: #0d0d0d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Roboto', 'Segoe UI', sans-serif;
        }

        .nf-card {
          background: #17181d;
          border: 1px solid #222430;
          border-radius: 20px;
          padding: 56px 48px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .nf-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .nf-logo { width: 40px; height: 40px; object-fit: contain; }
        .nf-wordmark {
          font-weight: 800;
          font-size: 1.1rem;
          color: #ffffff;
          letter-spacing: 0.03em;
        }

        .nf-code {
          font-size: 5rem;
          font-weight: 800;
          color: #2563eb;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .nf-title {
          color: #ffffff;
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-top: -8px;
        }

        .nf-desc {
          color: #8a93a8;
          font-size: 0.93rem;
          line-height: 1.65;
          max-width: 360px;
        }

        .nf-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn-primary {
          display: inline-block;
          padding: 11px 28px;
          background: #2563eb;
          color: #fff;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s;
        }
        .nf-btn-primary:hover { background: #1d4ed8; }

        .nf-btn-secondary {
          display: inline-block;
          padding: 11px 28px;
          background: transparent;
          color: #8a93a8;
          border: 1px solid #2a2d3a;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .nf-btn-secondary:hover { border-color: #2563eb; color: #c8d3ea; }

        .nf-divider { width: 100%; height: 1px; background: #222430; }

        .nf-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .nf-links a {
          color: #5272a8;
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }
        .nf-links a:hover { color: #7cc4ff; }

        @media (max-width: 480px) {
          .nf-card { padding: 40px 24px; }
          .nf-code { font-size: 4rem; }
          .nf-title { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
