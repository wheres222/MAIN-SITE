import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Product Videos — CheatParadise",
  description:
    "Watch gameplay videos, feature showcases, and setup tutorials for all CheatParadise products.",
  alternates: { canonical: "/videos" },
};

interface VideoEntry {
  game: string;
  title: string;
  description: string;
  youtubeId: string | null;
  tags?: string[];
}

// ─── ADD YOUR VIDEOS HERE ─────────────────────────────────────────────────────
// Set youtubeId to the YouTube video ID (the part after ?v= or youtu.be/).
// Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ → youtubeId: "dQw4w9WgXcQ"
// Set youtubeId to null for "coming soon" placeholders.
// ─────────────────────────────────────────────────────────────────────────────
const VIDEOS: VideoEntry[] = [
  {
    game: "Rust",
    title: "Rust External — Full Feature Showcase",
    description: "ESP, aimbot, and all misc features demonstrated in a live session.",
    youtubeId: null,
    tags: ["ESP", "Aimbot", "Showcase"],
  },
  {
    game: "Valorant",
    title: "Valorant External — Ranked Gameplay",
    description: "Safe settings demonstration in a live ranked match.",
    youtubeId: null,
    tags: ["Ranked", "Safe Settings"],
  },
  {
    game: "Apex Legends",
    title: "Apex External — Feature Overview",
    description: "Overview of all available features with settings walkthrough.",
    youtubeId: null,
    tags: ["Features", "Walkthrough"],
  },
  {
    game: "Counter Strike 2",
    title: "CS2 External — ESP Demo",
    description: "Player and loot ESP in a live competitive session.",
    youtubeId: null,
    tags: ["ESP", "Competitive"],
  },
  {
    game: "Escape From Tarkov",
    title: "EFT External — Raid Gameplay",
    description: "Full raid gameplay with player, item, and container ESP active.",
    youtubeId: null,
    tags: ["Raid", "ESP", "Loot"],
  },
  {
    game: "Rainbow Six Siege",
    title: "R6 External — Safe Settings Guide",
    description: "How to configure safe settings for ranked play.",
    youtubeId: null,
    tags: ["Ranked", "Setup"],
  },
  {
    game: "Fortnite",
    title: "Fortnite External — Gameplay Preview",
    description: "Live gameplay preview with aimbot and ESP enabled.",
    youtubeId: null,
    tags: ["Gameplay", "Preview"],
  },
  {
    game: "Setup & Tutorials",
    title: "How to Install Any CheatParadise Product",
    description: "Step-by-step installation guide covering BIOS, loader setup, and first launch.",
    youtubeId: null,
    tags: ["Tutorial", "Setup"],
  },
];
// ─────────────────────────────────────────────────────────────────────────────

function VideoCard({ entry }: { entry: VideoEntry }) {
  const hasVideo = entry.youtubeId !== null;
  const thumbUrl = hasVideo
    ? `https://img.youtube.com/vi/${entry.youtubeId}/maxresdefault.jpg`
    : null;

  return (
    <article className="video-card">
      <div className="video-thumb-wrap">
        {hasVideo ? (
          <a
            href={`https://www.youtube.com/watch?v=${entry.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="video-thumb-link"
            aria-label={`Watch ${entry.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl!}
              alt={entry.title}
              className="video-thumb-img"
              loading="lazy"
            />
            <span className="video-play-btn" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.7)" />
                <path d="M10 8l6 4-6 4V8Z" fill="white" />
              </svg>
            </span>
          </a>
        ) : (
          <div className="video-thumb-placeholder">
            <svg viewBox="0 0 24 24" fill="none" width="36" height="36" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 8l6 4-6 4V8Z" fill="currentColor" />
            </svg>
            <span>Coming Soon</span>
          </div>
        )}
      </div>

      <div className="video-card-body">
        <span className="video-card-game">{entry.game}</span>
        <h3 className="video-card-title">{entry.title}</h3>
        <p className="video-card-desc">{entry.description}</p>
        {entry.tags && entry.tags.length > 0 && (
          <div className="video-card-tags">
            {entry.tags.map((tag) => (
              <span key={tag} className="video-tag">{tag}</span>
            ))}
          </div>
        )}
        {hasVideo && (
          <a
            href={`https://www.youtube.com/watch?v=${entry.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="video-watch-btn"
          >
            Watch on YouTube →
          </a>
        )}
      </div>
    </article>
  );
}

export default function VideosPage() {
  const liveCount = VIDEOS.filter((v) => v.youtubeId !== null).length;

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <main className="shell subpage-wrap videos-page">
        {/* Hero */}
        <section className="videos-hero">
          <div className="videos-hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="30" height="30">
              <path d="m22 8-6 4 6 4V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
          <h1>Product <span className="videos-hero-accent">Videos</span></h1>
          <p>
            Watch live gameplay showcases, feature overviews, and setup tutorials for all our products.
            {liveCount > 0 ? ` ${liveCount} video${liveCount !== 1 ? "s" : ""} available.` : " More videos coming soon."}
          </p>
        </section>

        {/* Grid */}
        <section className="videos-grid">
          {VIDEOS.map((entry, i) => (
            <VideoCard key={`${entry.game}-${i}`} entry={entry} />
          ))}
        </section>

        {/* YouTube channel strip */}
        <section className="videos-channel-strip">
          <div className="videos-channel-copy">
            <h2>Subscribe for More</h2>
            <p>New gameplay clips and feature previews are posted regularly. Subscribe to stay updated.</p>
          </div>
          <a
            href="https://www.youtube.com/@lllarp"
            target="_blank"
            rel="noreferrer"
            className="videos-yt-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
            </svg>
            YouTube Channel
          </a>
        </section>
      </main>

      <style>{`
        .videos-page { padding-bottom: 80px; }

        .videos-hero {
          margin-top: 48px;
          margin-bottom: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .videos-hero-icon {
          width: 64px; height: 64px;
          background: rgba(37,99,235,0.12);
          border: 1px solid rgba(37,99,235,0.3);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: #60a5fa;
          margin-bottom: 4px;
        }
        .videos-hero h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .videos-hero-accent { color: #2563eb; }
        .videos-hero p { margin: 0; color: #8a96b2; font-size: 1rem; max-width: 480px; }

        .videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .video-card {
          background: #1a1b20;
          border: 1px solid #242833;
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.15s;
        }
        .video-card:hover { border-color: #2563eb; }

        .video-thumb-wrap { aspect-ratio: 16/9; position: relative; overflow: hidden; background: #0e0f12; }
        .video-thumb-link { display: block; width: 100%; height: 100%; position: relative; }
        .video-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.2s; }
        .video-thumb-link:hover .video-thumb-img { opacity: 0.85; }
        .video-play-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .video-thumb-link:hover .video-play-btn { opacity: 1; }

        .video-thumb-placeholder {
          width: 100%; height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #2d3550;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .video-card-body { padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .video-card-game {
          font-size: 0.7rem;
          font-weight: 700;
          color: #5272a8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .video-card-title {
          margin: 0;
          font-size: 0.97rem;
          font-weight: 700;
          color: #f0f4ff;
          line-height: 1.3;
        }
        .video-card-desc { margin: 0; font-size: 0.83rem; color: #7a8899; line-height: 1.5; }

        .video-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .video-tag {
          padding: 2px 8px;
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 600;
          color: #60a5fa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .video-watch-btn {
          margin-top: auto;
          padding-top: 10px;
          font-size: 0.83rem;
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.12s;
        }
        .video-watch-btn:hover { color: #93c5fd; }

        .videos-channel-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: #1a1b20;
          border: 1px solid #242833;
          border-radius: 14px;
          padding: 28px 32px;
        }
        .videos-channel-copy h2 { margin: 0 0 6px; font-size: 1.1rem; font-weight: 700; color: #f0f4ff; }
        .videos-channel-copy p { margin: 0; font-size: 0.88rem; color: #7a8899; }
        .videos-yt-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          background: #ff0000;
          color: #fff;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .videos-yt-btn:hover { background: #cc0000; }

        @media (max-width: 640px) {
          .videos-grid { grid-template-columns: 1fr; }
          .videos-channel-strip { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <SiteFooter />
    </div>
  );
}
