"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { LazyVideo } from "@/components/lazy-video";

// Lazy-load heavy below-fold components so they don't bloat the initial JS bundle
const ReviewsMarquee = dynamic(
  () => import("@/components/reviews-marquee").then((m) => ({ default: m.ReviewsMarquee })),
  { ssr: false }
);
const DiscordShowcase = dynamic(
  () => import("@/components/discord-showcase").then((m) => ({ default: m.DiscordShowcase })),
  { ssr: false }
);
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontProvider } from "@/context/storefront-context";
import { categoryHref } from "@/lib/category-href";
import { CATEGORY_IMAGES, CATEGORY_TILES } from "@/lib/category-images";
import { canonicalGameSlug } from "@/lib/game-slug";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";

function canonicalGroupSlug(value: string): string {
  const raw = value || "";
  if (/^\s*(?:b0?7\s*)?(?:wz\s*)?(?:internal|external)\s*$/i.test(raw)) {
    return "call-of-duty";
  }

  const slug = canonicalGameSlug(raw);
  const compact = slug.replace(/-/g, "");
  if (
    compact === "b07" ||
    compact === "wz" ||
    compact === "wzexternal" ||
    compact === "wzinternal" ||
    compact === "b07wzexternal" ||
    compact === "b07wzinternal"
  ) {
    return "call-of-duty";
  }

  return slug;
}

function productLowestPrice(product: SellAuthProduct): number | null {
  const prices: number[] = [];
  if (typeof product.price === "number") prices.push(product.price);
  for (const variant of product.variants) {
    if (typeof variant.price === "number") prices.push(variant.price);
  }
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

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

  const lowestPriceBySlug = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of storefront?.products || []) {
      const slug = canonicalGroupSlug(product.groupName || product.categoryName || "");
      if (!slug) continue;
      const price = productLowestPrice(product);
      if (price === null) continue;
      const existing = map.get(slug);
      if (existing === undefined || price < existing) map.set(slug, price);
    }
    return map;
  }, [storefront?.products]);

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
            <div className="home-hero-character" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/hero-character.avif"
                alt=""
                width={400}
                height={540}
                className="home-hero-character-img"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <div className="trust-bar">
          <div className="home-shell trust-bar-inner">
            <span className="trust-bar-item"><strong>14,000+</strong> orders delivered</span>
            <span className="trust-bar-sep" aria-hidden="true" />
            <span className="trust-bar-item"><strong>4.9★</strong> average rating</span>
            <span className="trust-bar-sep" aria-hidden="true" />
            <span className="trust-bar-item"><strong>Instant</strong> delivery</span>
            <span className="trust-bar-sep" aria-hidden="true" />
            <span className="trust-bar-item"><strong>24/7</strong> Discord support</span>
          </div>
        </div>

        {/* ── Shop by Game ── */}
        <section className="home-shell home-section" id="products">
          <div className="panel">
            <header className="panel-header">Shop by Game</header>
            <div className="panel-body">
              <div className="game-tiles">
                {CATEGORY_TILES.map((tile, i) => {
                  const img = CATEGORY_IMAGES[tile.slug];
                  if (!img) return null;
                  const price = lowestPriceBySlug.get(tile.slug) ?? null;
                  return (
                    <Link key={tile.slug} href={categoryHref(tile.slug)} className="game-tile">
                      <Image
                        className="game-tile-img"
                        src={img}
                        alt={`${tile.name} cheats`}
                        width={400}
                        height={225}
                        sizes="(max-width: 640px) 50vw, (max-width: 1080px) 33vw, 25vw"
                        priority={i < 4}
                      />
                      <span className="game-tile-info">
                        <span className="game-tile-name">{tile.name}</span>
                        {price !== null && (
                          <span className="game-tile-price">from {money(price)}</span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Gameplay footage (below products) ── */}
        <section className="home-shell footage-section" aria-label="Gameplay footage">
          <div className="footage-grid">
            {([
              { label: "FORTNITE FOOTAGE",    src: "/footage/fortnite.mp4", poster: "/footage/fortnite-poster.webp" },
              { label: "ARC RAIDERS FOOTAGE", src: "/footage/arc.mp4",      poster: "/footage/arc-poster.webp" },
              { label: "RUST FOOTAGE",        src: "/footage/rust.mp4",     poster: "/footage/rust-poster.webp" },
            ] as const).map(({ label, src, poster }) => (
              <div key={label} className="footage-card">
                <LazyVideo className="footage-video" src={src} poster={poster} ariaLabel={label} />
                <div className="footage-label">
                  <span className="footage-dot" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reviews slider ── */}
        <ReviewsMarquee />

        {/* ── FAQ ── */}
        <section className="home-shell home-section" id="faq">
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
        <section className="home-shell home-section">
          <DiscordShowcase />
        </section>

      </main>

      <SiteFooter />
    </div>
    </StorefrontProvider>
  );
}
