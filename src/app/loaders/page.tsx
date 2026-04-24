import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Loaders & Setup Files — CheatParadise",
  description:
    "Download the latest loaders and setup files for all CheatParadise products. Always run the loader as administrator for best results.",
  alternates: { canonical: "/loaders" },
};

interface LoaderEntry {
  game: string;
  product: string;
  version: string;
  downloadUrl: string | null;
  status: "undetected" | "detected" | "maintenance" | "coming_soon";
  notes?: string;
}

// ─── ADD YOUR LOADERS HERE ────────────────────────────────────────────────────
// Set downloadUrl to the direct download link for each loader.
// Set status to reflect current detection status.
// Add/remove entries to match your product catalog.
const LOADERS: LoaderEntry[] = [
  {
    game: "Apex Legends",
    product: "Apex External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Call of Duty",
    product: "COD External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Counter Strike 2",
    product: "CS2 External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Escape From Tarkov",
    product: "EFT External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Fortnite",
    product: "Fortnite External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Rainbow Six Siege",
    product: "R6 External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Rust",
    product: "Rust External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
  {
    game: "Valorant",
    product: "Valorant External",
    version: "v1.0.0",
    downloadUrl: null,
    status: "coming_soon",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<LoaderEntry["status"], string> = {
  undetected: "Undetected",
  detected: "Detected",
  maintenance: "Maintenance",
  coming_soon: "Coming Soon",
};

function StatusBadge({ status }: { status: LoaderEntry["status"] }) {
  const colors: Record<LoaderEntry["status"], string> = {
    undetected: "loader-badge-green",
    detected: "loader-badge-red",
    maintenance: "loader-badge-yellow",
    coming_soon: "loader-badge-gray",
  };
  return <span className={`loader-badge ${colors[status]}`}>{STATUS_LABELS[status]}</span>;
}

export default function LoadersPage() {
  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <main className="shell subpage-wrap loaders-page">
        {/* Hero */}
        <section className="loaders-hero">
          <div className="loaders-hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Loaders <span className="loaders-hero-accent">&amp; Setup Files</span></h1>
          <p>
            Download the latest loaders for your purchased products. Always run as{" "}
            <strong>Administrator</strong> and disable antivirus before launching.
            Follow the{" "}
            <a href="/guide" className="loaders-hero-link">setup guide</a>{" "}
            if this is your first time.
          </p>
        </section>

        {/* Warning banner */}
        <div className="loaders-warning">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true" className="loaders-warning-icon">
            <path d="M12 9v4M12 17h.01M10.3 3.6L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            These loaders are for <strong>purchased products only</strong>. You must have an active license key to use them.
            Never share your key — it is tied to your hardware.
          </span>
        </div>

        {/* Loader grid */}
        <section className="loaders-grid">
          {LOADERS.map((entry) => (
            <article key={`${entry.game}-${entry.product}`} className="loader-card">
              <div className="loader-card-top">
                <div className="loader-card-info">
                  <span className="loader-card-game">{entry.game}</span>
                  <h3 className="loader-card-product">{entry.product}</h3>
                </div>
                <StatusBadge status={entry.status} />
              </div>

              <div className="loader-card-meta">
                <span className="loader-card-version">
                  <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {entry.version}
                </span>
              </div>

              {entry.notes && (
                <p className="loader-card-notes">{entry.notes}</p>
              )}

              <div className="loader-card-actions">
                {entry.downloadUrl ? (
                  <a
                    href={entry.downloadUrl}
                    className="loader-download-btn"
                    download
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download Loader
                  </a>
                ) : (
                  <span className="loader-download-btn loader-download-disabled" aria-disabled="true">
                    {entry.status === "coming_soon" ? "Coming Soon" : "Unavailable"}
                  </span>
                )}
                <a href="/guide" className="loader-guide-link">
                  Setup Guide →
                </a>
              </div>
            </article>
          ))}
        </section>

        {/* Help strip */}
        <section className="loaders-help-strip">
          <div className="loaders-help-item">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <strong>Disable Antivirus</strong>
              <span>Windows Defender and third-party AV must be off before launching.</span>
            </div>
          </div>
          <div className="loaders-help-item">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
              <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <strong>Run as Administrator</strong>
              <span>Right-click the loader and select "Run as administrator" every time.</span>
            </div>
          </div>
          <div className="loaders-help-item">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <strong>Need Help?</strong>
              <span>Open a ticket in our <a href="/support" className="loaders-inline-link">Discord support server</a>.</span>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .loaders-page { padding-bottom: 80px; }

        .loaders-hero {
          margin-top: 48px;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .loaders-hero-icon {
          width: 64px; height: 64px;
          background: rgba(37,99,235,0.12);
          border: 1px solid rgba(37,99,235,0.3);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: #60a5fa;
          margin-bottom: 4px;
        }
        .loaders-hero h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .loaders-hero-accent { color: #2563eb; }
        .loaders-hero p {
          margin: 0;
          max-width: 560px;
          color: #8a96b2;
          font-size: 1rem;
          line-height: 1.6;
        }
        .loaders-hero-link { color: #60a5fa; text-decoration: underline; text-underline-offset: 3px; }

        .loaders-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(234,179,8,0.07);
          border: 1px solid rgba(234,179,8,0.25);
          border-radius: 10px;
          padding: 14px 18px;
          color: #d4b83a;
          font-size: 0.88rem;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        .loaders-warning-icon { flex-shrink: 0; margin-top: 1px; }
        .loaders-warning strong { color: #fcd34d; }

        .loaders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 48px;
        }

        .loader-card {
          background: #1a1b20;
          border: 1px solid #242833;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.15s;
        }
        .loader-card:hover { border-color: #2563eb; }

        .loader-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .loader-card-info { display: flex; flex-direction: column; gap: 3px; }
        .loader-card-game {
          font-size: 0.72rem;
          font-weight: 700;
          color: #5272a8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .loader-card-product {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #f0f4ff;
        }

        .loader-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .loader-badge-green { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
        .loader-badge-red   { background: rgba(239,68,68,0.1);  color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .loader-badge-yellow{ background: rgba(234,179,8,0.1);  color: #fbbf24; border: 1px solid rgba(234,179,8,0.25); }
        .loader-badge-gray  { background: rgba(100,116,139,0.1);color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

        .loader-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .loader-card-version {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #5272a8;
          font-weight: 500;
        }

        .loader-card-notes {
          margin: 0;
          font-size: 0.82rem;
          color: #7a8899;
          line-height: 1.5;
        }

        .loader-card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: auto;
        }
        .loader-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          background: #2563eb;
          color: #fff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s;
          border: none;
        }
        .loader-download-btn:hover { background: #1d4ed8; }
        .loader-download-disabled {
          background: #1e2232;
          color: #475069;
          cursor: not-allowed;
        }
        .loader-download-disabled:hover { background: #1e2232; }
        .loader-guide-link {
          font-size: 0.82rem;
          color: #60a5fa;
          text-decoration: none;
          white-space: nowrap;
        }
        .loader-guide-link:hover { text-decoration: underline; text-underline-offset: 3px; }

        .loaders-help-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          background: #1a1b20;
          border-radius: 14px;
          padding: 28px;
        }
        .loaders-help-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          color: #7a8899;
        }
        .loaders-help-item svg { flex-shrink: 0; color: #2563eb; margin-top: 2px; }
        .loaders-help-item div { display: flex; flex-direction: column; gap: 4px; }
        .loaders-help-item strong { font-size: 0.9rem; color: #d0d8e8; font-weight: 700; }
        .loaders-help-item span { font-size: 0.82rem; line-height: 1.5; }
        .loaders-inline-link { color: #60a5fa; text-decoration: underline; text-underline-offset: 3px; }

        @media (max-width: 780px) {
          .loaders-help-strip { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
          .loaders-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <SiteFooter />
    </div>
  );
}
