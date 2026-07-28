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
          <img src="/branding/cp-logo.webp" alt="CheatParadise" className="nf-logo" />
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
          <Link href="/faq">FAQ</Link>
        </nav>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nf-root {
          min-height: 100vh;
          background: var(--surface-0);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          font-family: var(--font-body);
        }

        .nf-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: var(--space-14) var(--space-12);
          max-width: 500px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-5);
        }

        .nf-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
        }
        .nf-logo { width: 40px; height: 40px; object-fit: contain; }
        .nf-wordmark {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: var(--text-lg);
          color: var(--text-primary);
          letter-spacing: 0.03em;
        }

        .nf-code {
          font-family: var(--font-display);
          font-size: 5rem;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .nf-title {
          font-family: var(--font-display);
          color: var(--text-primary);
          font-size: var(--text-2xl);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-top: -8px;
        }

        .nf-desc {
          color: var(--text-muted);
          font-size: var(--text-sm);
          line-height: 1.65;
          max-width: 360px;
        }

        .nf-actions {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn-primary {
          display: inline-block;
          padding: var(--space-3) var(--space-8);
          background: var(--accent);
          color: #fff;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 700;
          text-decoration: none;
          transition: background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
        }
        .nf-btn-primary:hover { background: var(--accent-hover); box-shadow: var(--accent-glow); }

        .nf-btn-secondary {
          display: inline-block;
          padding: var(--space-3) var(--space-8);
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 600;
          text-decoration: none;
          transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .nf-btn-secondary:hover { border-color: var(--accent); color: var(--text-primary); }

        .nf-divider { width: 100%; height: 1px; background: var(--border); }

        .nf-links {
          display: flex;
          gap: var(--space-5);
          flex-wrap: wrap;
          justify-content: center;
        }
        .nf-links a {
          color: var(--text-muted);
          font-size: var(--text-sm);
          font-weight: 500;
          text-decoration: none;
          transition: color var(--dur-fast) var(--ease-out);
        }
        .nf-links a:hover { color: var(--accent); }

        @media (max-width: 480px) {
          .nf-card { padding: var(--space-10) var(--space-6); }
          .nf-code { font-size: 4rem; }
          .nf-title { font-size: var(--text-xl); }
        }
      `}</style>
    </div>
  );
}
