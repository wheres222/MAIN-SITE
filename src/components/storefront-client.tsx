"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { LazyVideo } from "@/components/lazy-video";
import { EspCompare } from "@/components/esp-compare";
import { ReviewCards } from "@/components/review-cards";

// Lazy-load heavy below-fold components so they don't bloat the initial JS bundle
const DiscordShowcase = dynamic(
  () => import("@/components/discord-showcase").then((m) => ({ default: m.DiscordShowcase })),
  { ssr: false }
);
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontProvider } from "@/context/storefront-context";
import { categoryHref } from "@/lib/category-href";
import { DISCORD_INVITE_URL } from "@/lib/links";
import { buildCategoryTiles } from "@/lib/category-tiles";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import type { StorefrontData } from "@/types/sellauth";

/**
 * Swaps the full "Shop by Game" tile grid on the homepage for the tall cover
 * cards below. Off while the cover art is still being made — with only Rust
 * and ARC Raiders drawn, turning this on hides the rest of the catalogue.
 *
 * Set to true once every category in CATEGORY_CARDS has artwork.
 */
const CATEGORY_CARDS_ONLY = false;

const CATEGORY_CARDS = [
  { slug: "rust",        name: "Rust",        image: "/category-cards/rust.png" },
  { slug: "arc-raiders", name: "ARC Raiders", image: "/category-cards/arc-raiders.png" },
] as const;

function money(value: number | null, currency = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function StorefrontClient({ initialData }: { initialData?: StorefrontData | null }) {
  const [storefront, setStorefront] = useState<StorefrontData | null>(initialData ?? null);
  const [adspotOpen, setAdspotOpen] = useState(false);

  // Close the ad-spot popup on Escape, and lock page scroll while it's open.
  useEffect(() => {
    if (!adspotOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAdspotOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [adspotOpen]);

  useEffect(() => {
    // Prime the client cache with SSR data, then revalidate in the background
    // so navigating away and back is instant while staying fresh.
    if (initialData) primeStorefrontCache(initialData);

    let active = true;
    fetchStorefrontClient({ force: false })
      .then((data) => {
        if (active) setStorefront(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialData]);

  // Derived live from SellAuth — adding a category there makes it appear here
  // automatically, after the curated games.
  const categoryTiles = useMemo(() => buildCategoryTiles(storefront), [storefront]);

  return (
    <StorefrontProvider data={storefront}>
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main id="top">
        {/* ── Hero ── */}
        <section className="home-hero">
          <div className="home-shell home-hero-inner">
            <div className="home-hero-copy">
              <h1 className="home-hero-title">
                If you can&apos;t beat them, <span className="accent">Join Them.</span>
              </h1>
              <p className="home-hero-sub">
                Premium, undetected game enhancements with instant delivery and 24/7 support.
                Trusted by thousands of players since 2022.
              </p>
              <div className="home-hero-cta">
                <a href="#products" className="btn-primary">Browse Cheats</a>
                <a href="/status" className="btn-ghost">View Live Status →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ad spots — rentable placements ── */}
        <section className="adspots" aria-label="Advertising spots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              className="adspot"
              onClick={() => setAdspotOpen(true)}
            >
              <span className="adspot-label">Purchase ADSPOT</span>
              <span className="adspot-size">550 × 90</span>
            </button>
          ))}
        </section>

        {/* ── Shop by Game ── */}
        <section className="home-shell home-section" id="products" aria-label="Shop by game">
          {CATEGORY_CARDS_ONLY ? (
            <div className="cat-cards">
              {CATEGORY_CARDS.map((card) => (
                <Link key={card.slug} href={categoryHref(card.slug)} className="cat-card">
                  <Image
                    className="cat-card-img"
                    src={card.image}
                    alt={`${card.name} cheats`}
                    width={1080}
                    height={1920}
                    sizes="(max-width: 720px) 44vw, 280px"
                    priority
                  />
                </Link>
              ))}
            </div>
          ) : (
          <div className="panel panel-flat">
            <div className="panel-body">
              <div className="game-tiles">
                {categoryTiles.map((tile, i) => (
                  <Link key={tile.slug} href={categoryHref(tile.slug)} className="game-tile">
                    {tile.usesRemoteImage ? (
                      /* Newly added SellAuth categories serve their art from an
                         arbitrary host, so a plain <img> is used here — an
                         unconfigured host would make next/image throw and blank
                         the whole page. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="game-tile-img"
                        src={tile.image}
                        alt={`${tile.name} cheats`}
                        width={400}
                        height={225}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <Image
                        className="game-tile-img"
                        src={tile.image}
                        alt={`${tile.name} cheats`}
                        width={400}
                        height={225}
                        sizes="(max-width: 640px) 50vw, (max-width: 1080px) 33vw, 25vw"
                        loading={i < 4 ? "eager" : "lazy"}
                      />
                    )}
                    <span className="game-tile-info">
                      <span className="game-tile-name">{tile.name}</span>
                      {tile.lowestPrice !== null && (
                        <span className="game-tile-price">from {money(tile.lowestPrice)}</span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          )}
        </section>

        {/* ── Before/after: what the anti-cheat sees vs what you see ── */}
        <section className="home-shell home-section-lg" aria-label="Anti-cheat comparison">
          <EspCompare />
        </section>

        {/* ── Reviews ── */}
        <ReviewCards />

        {/* ── Gameplay footage (below the reviews) ── */}
        <section className="home-shell footage-section" aria-label="Gameplay footage">
          <div className="footage-grid">
            {([
              { label: "Fortnite",    src: "/footage/fortnite.mp4", poster: "/footage/fortnite-poster.webp" },
              { label: "ARC Raiders", src: "/footage/arc.mp4",      poster: "/footage/arc-poster.webp" },
              { label: "Rust",        src: "/footage/rust.mp4",     poster: "/footage/rust-poster.webp" },
            ] as const).map(({ label, src, poster }) => (
              <div key={label} className="footage-card">
                <LazyVideo className="footage-video" src={src} poster={poster} ariaLabel={`${label} gameplay footage`} />
                <div className="media-pill footage-label">
                  <span className="footage-dot" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="home-shell home-section-lg" id="faq">
          <div className="panel">
            <header className="panel-header">Frequently Asked Questions</header>
            <div className="panel-body home-faq">
              {[
                { q: "Are your cheats undetected?", a: "Every product is tested against the game's current anti-cheat before release and monitored continuously. Detection status for each product is shown live on our Status page." },
                { q: "How fast is delivery?", a: "Instant. Your license key is delivered automatically to your account dashboard and email the moment your payment confirms — crypto usually clears in 1–5 minutes." },
                { q: "Will I get banned?", a: "Risk is minimised by legit play and humanised settings. As long as you run the current undetected build and play sensibly, bans are rare." },
                { q: "What payment methods do you accept?", a: "Card payments via Stripe, plus Bitcoin, Ethereum, Litecoin, USDT and more via crypto. You can also top up your account balance." },
                { q: "Do you offer support?", a: "Yes — 24/7 support through our Discord community, answered by the same team that builds the products." },
                { q: "Can I get a refund?", a: "Refunds follow our Refund Policy (linked in the footer). Reach out in Discord and our team will help." },
              ].map((item) => (
                <details key={item.q} className="home-faq-item">
                  <summary className="home-faq-q">{item.q}</summary>
                  <p className="home-faq-a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Discord community (lazy-loads on scroll) ── */}
        <section className="home-shell home-section-lg home-section-last">
          <DiscordShowcase />
        </section>

      </main>

      {/* ── Ad-spot enquiry popup ── */}
      {adspotOpen && (
        <div
          className="adspot-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAdspotOpen(false);
          }}
        >
          <div className="adspot-modal" role="dialog" aria-modal="true" aria-labelledby="adspot-modal-title">
            <div className="adspot-modal-header">
              <h3 id="adspot-modal-title">Advertise on Cheat Paradise</h3>
              <button
                type="button"
                className="adspot-modal-close"
                aria-label="Close"
                onClick={() => setAdspotOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="adspot-modal-body">
              <p className="adspot-modal-lead">
                Three banner slots sit directly beneath the trust bar on our homepage — the first
                thing every visitor sees above the store.
              </p>
              <dl className="adspot-modal-specs">
                <div>
                  <dt>Banner size</dt>
                  <dd>550 × 90</dd>
                </div>
                <div>
                  <dt>Placement</dt>
                  <dd>Homepage, above the fold</dd>
                </div>
                <div>
                  <dt>Slots</dt>
                  <dd>3 available</dd>
                </div>
                <div>
                  <dt>Formats</dt>
                  <dd>PNG, JPG, WEBP or GIF</dd>
                </div>
              </dl>
              <p className="adspot-modal-note">
                Open a ticket in our Discord to check availability and pricing. Send your artwork and
                destination link and we&apos;ll have the spot live the same day.
              </p>
              <a
                className="btn-primary adspot-modal-cta"
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enquire on Discord
              </a>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
    </StorefrontProvider>
  );
}
