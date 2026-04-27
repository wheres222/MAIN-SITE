"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { StorefrontProvider } from "@/context/storefront-context";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { canonicalGameSlug, toGameSlug } from "@/lib/game-slug";
import { productHref } from "@/lib/product-route";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import { formatStorefrontWarnings } from "@/lib/storefront-warnings";
import type { SellAuthGroup, SellAuthProduct, StorefrontData } from "@/types/sellauth";

function hoverImageFor(source: string): string {
  if (source.startsWith("/pd/")) {
    return source.replace("/pd/", "/pd-hover/");
  }
  if (source.startsWith("/pd.png/")) {
    return source.replace("/pd.png/", "/pd-hover/");
  }
  return source;
}


function isProductLikeCategoryLabel(value: string): boolean {
  return /^\s*(?:b0?7\s*)?(?:wz\s*)?(?:internal|external)\s*$/i.test(value || "");
}

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

function groupLabelForSlug(slug: string): string {
  if (slug === "call-of-duty") return "COD";
  if (slug === "counter-strike-2") return "CS2";
  if (slug === "rainbow-six-siege") return "Rainbow Six Siege";
  if (slug === "vpns") return "VPNS";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeGroupTileName(name: string): string {
  const slug = canonicalGroupSlug(name);
  if (!slug) return name;
  const rawSlug = toGameSlug(name || "");
  if (slug !== rawSlug) {
    return groupLabelForSlug(slug);
  }
  return name;
}

const HIDDEN_GROUP_SLUGS = new Set([
  "valorant",
  "pubg",
  "fivem",
  "roblox",
]);

// Static category images keyed by canonical slug
const CATEGORY_IMAGES: Record<string, string> = {
  "arc-raiders":          "/category/arc_raiders_category.png",
  "fortnite":             "/category/fortnite_category.png",
  "rainbow-six-siege":    "/category/r6_category.png",
  "rust":                 "/category/rust_category.png",
  "apex":                 "/category/apex_category.png",
  "counter-strike-2":     "/category/cs2_category.png",
  "escape-from-tarkov":   "/category/escape_from_tarkov_category.png",
  "hwid-spoofers":        "/category/spoofer_category.png",
};

const PRIORITY_GROUP_ORDER = [
  "rust",
  "arc-raiders",
  "call-of-duty",
  "fortnite",
  "fivem",
  "roblox",
  "counter-strike-2",
  "rainbow-six-siege",
];

const BOTTOM_GROUP_ORDER = ["accounts", "vpns", "vpn"];

function groupSortPriority(slug: string): number {
  const priorityIndex = PRIORITY_GROUP_ORDER.indexOf(slug);
  if (priorityIndex >= 0) return priorityIndex;

  const bottomIndex = BOTTOM_GROUP_ORDER.indexOf(slug);
  if (bottomIndex >= 0) return 10_000 + bottomIndex;

  return 5_000;
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

function shouldContainCategoryImage(slug: string): boolean {
  return false;
}

function HeroSlideshow({ slides }: { slides: Array<{ src: string; name: string; href: string }> }) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setIdx((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 300);
    }, 3800);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[idx];

  return (
    <div className="hero-slideshow">
      <div className="hero-ss-card">
        <Link href={slide.href} className="hero-ss-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.name}
            className={`hero-ss-img${fading ? " hero-ss-fading" : ""}`}
          />
        </Link>
      </div>
      <span className="hero-ss-name">{slide.name}</span>
    </div>
  );
}

export function StorefrontClient({ initialData }: { initialData?: StorefrontData | null }) {
  const [storefront, setStorefront] = useState<StorefrontData | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState("");

  // Prime the client-side cache with SSR data so navigating away and back is instant
  useEffect(() => {
    if (initialData) primeStorefrontCache(initialData);
  }, [initialData]);

  useEffect(() => {
    // If we got SSR data, do a background revalidation after mount instead of blocking render
    if (initialData) {
      fetchStorefrontClient({ force: false }).then((data) => setStorefront(data)).catch(() => {});
      return;
    }

    let active = true;
    (async () => {
      try {
        const data = await fetchStorefrontClient();
        if (!active) return;
        setStorefront(data);
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load storefront."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialData]);

  const filteredGroups = useMemo(() => {
    const baseGroups = storefront?.groups || [];
    const categories = storefront?.categories || [];

    const groups = [
      ...baseGroups,
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
      })),
    ]
      // Defensive guard: raw product labels should never be rendered as category tiles.
      .filter((group) => !isProductLikeCategoryLabel(group.name))
      .map((group) => ({
        ...group,
        name: normalizeGroupTileName(group.name),
      }));

    const productCountBySlug = new Map<string, number>();
    const directProductCountByGroupId = new Map<number, number>();
    const directProductCountByCategoryId = new Map<number, number>();

    for (const product of storefront?.products || []) {
      const groupSlug = canonicalGroupSlug(product.groupName || "");
      const categorySlug = canonicalGroupSlug(product.categoryName || "");
      if (groupSlug) {
        productCountBySlug.set(groupSlug, (productCountBySlug.get(groupSlug) || 0) + 1);
      }
      if (categorySlug) {
        productCountBySlug.set(categorySlug, (productCountBySlug.get(categorySlug) || 0) + 1);
      }
      if (product.groupId !== null) {
        directProductCountByGroupId.set(
          product.groupId,
          (directProductCountByGroupId.get(product.groupId) || 0) + 1
        );
      }
      if (product.categoryId !== null) {
        directProductCountByCategoryId.set(
          product.categoryId,
          (directProductCountByCategoryId.get(product.categoryId) || 0) + 1
        );
      }
    }

    const bestBySlug = new Map<string, (typeof groups)[number]>();
    const bestImageBySlug = new Map<string, string>();

    const directCountForGroup = (group: (typeof groups)[number]) => {
      return (directProductCountByGroupId.get(group.id) || 0) + (directProductCountByCategoryId.get(group.id) || 0);
    };

    for (const group of groups) {
      const slug = canonicalGroupSlug(group.name);
      if (!slug) continue;

      if (group.image?.url && !bestImageBySlug.has(slug)) {
        bestImageBySlug.set(slug, group.image.url);
      }

      const directCount = directCountForGroup(group);
      const slugCount = productCountBySlug.get(slug) || 0;
      const hasImage = Boolean(group.image?.url);
      const score = directCount * 1000 + slugCount * 100 + (hasImage ? 10 : 0);

      const existing = bestBySlug.get(slug);
      if (!existing) {
        bestBySlug.set(slug, group);
        continue;
      }

      const existingDirectCount = directCountForGroup(existing);
      const existingSlugCount = productCountBySlug.get(canonicalGroupSlug(existing.name)) || 0;
      const existingHasImage = Boolean(existing.image?.url);
      const existingScore =
        existingDirectCount * 1000 + existingSlugCount * 100 + (existingHasImage ? 10 : 0);

      if (score > existingScore) {
        bestBySlug.set(slug, group);
      }
    }

    return [...bestBySlug.values()]
      .map((group) => {
        const slug = canonicalGroupSlug(group.name);
        const familyImage = bestImageBySlug.get(slug);
        if (familyImage && !group.image?.url) {
          return { ...group, image: { url: familyImage } };
        }
        return group;
      })
      .filter((group) => {
        const slug = canonicalGroupSlug(group.name);
        if (!slug) return false;
        if (slug === "league-of-legends" || slug === "dayz") return false;
        if (HIDDEN_GROUP_SLUGS.has(slug) && (productCountBySlug.get(slug) || 0) === 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aSlug = canonicalGroupSlug(a.name);
        const bSlug = canonicalGroupSlug(b.name);
        const aPriority = groupSortPriority(aSlug);
        const bPriority = groupSortPriority(bSlug);

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name);
      });
  }, [storefront]);

  const warningMessages = useMemo(
    () => formatStorefrontWarnings(storefront?.warnings || []),
    [storefront?.warnings]
  );

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

  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    video.muted = true;

    const tryPlay = () => video.play().catch(() => {});

    // Attempt immediate autoplay (works in Chrome, Firefox)
    video.load();
    tryPlay();

    // Fallback for Brave / strict autoplay browsers:
    // play as soon as the user makes any interaction
    const onInteract = () => {
      tryPlay();
      document.removeEventListener("scroll",   onInteract);
      document.removeEventListener("click",    onInteract);
      document.removeEventListener("keydown",  onInteract);
      document.removeEventListener("touchstart", onInteract);
    };

    document.addEventListener("scroll",    onInteract, { once: true, passive: true });
    document.addEventListener("click",     onInteract, { once: true });
    document.addEventListener("keydown",   onInteract, { once: true });
    document.addEventListener("touchstart",onInteract, { once: true, passive: true });

    return () => {
      document.removeEventListener("scroll",    onInteract);
      document.removeEventListener("click",     onInteract);
      document.removeEventListener("keydown",   onInteract);
      document.removeEventListener("touchstart",onInteract);
    };
  }, []);

  const [bendooProgress, setBendooProgress] = useState(0);
  const bendooCardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let timer: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!timer) {
            timer = window.setInterval(() => {
              setBendooProgress((previous) => (previous >= 100 ? 0 : previous + 5));
            }, 1200);
          }
        } else {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      },
      { threshold: 0.1 }
    );

    if (bendooCardRef.current) observer.observe(bendooCardRef.current);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);

  const SLIDE_DEFS = [
    { src: "/slideshow/Ancient Arc.png",          name: "Ancient Arc Raiders",   search: "ancient",  fallback: "/categories?slug=arc-raiders" },
    { src: "/slideshow/Exodus Fortnite.png",       name: "Exodus Fortnite",       search: "exodus",   fallback: "/categories?slug=fortnite" },
    { src: "/slideshow/Game Accounts.webp",        name: "Steam Accounts",        search: "account",  fallback: "/categories?slug=accounts" },
    { src: "/slideshow/Mafia Rust.avif",           name: "Mafia Rust",            search: "mafia",    fallback: "/categories?slug=rust" },
    { src: "/slideshow/Predator CS2.png",          name: "Predator CS2",          search: "predator", fallback: "/categories?slug=counter-strike-2" },
    { src: "/slideshow/Rocket League Switch.png",  name: "Rocket League Switch",  search: "rocket",   fallback: "/categories?slug=rocket-league" },
  ];

  const slideshowSlides = useMemo(() => {
    const products = storefront?.products ?? [];
    return SLIDE_DEFS.map((def) => {
      const match = products.find((p) =>
        p.name.toLowerCase().includes(def.search)
      );
      return { src: def.src, name: def.name, href: match ? productHref(match) : def.fallback };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storefront?.products]);

  const bendooProgressStroke = useMemo(() => {
    const radius = 78;
    const circumference = 2 * Math.PI * radius;
    const filled = (bendooProgress / 100) * circumference;
    return `${filled.toFixed(1)} ${circumference.toFixed(1)}`;
  }, [bendooProgress]);

  return (
    <StorefrontProvider data={storefront}>
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main id="top">
        <section className="hero">
          <video
            ref={heroVideoRef}
            className="hero-bg-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src="/branding/hero.mp4" type="video/mp4" />
          </video>
          <div className="hero-bg-overlay" />
          <div className="shell hero-content">
            {/* Left: copy + CTAs */}
            <div className="hero-left">
              <h1 className="hero-title">
                <span className="hero-title-row">
                  <span className="hero-line-primary">Unlock Your </span>
                  <span className="hero-line-accent">Advantage.</span>
                </span>
                <span className="hero-title-row">
                  <span className="hero-line-primary">Play </span>
                  <span className="hero-line-accent">Without Limits.</span>
                </span>
              </h1>
              <p className="hero-subtext">
                Premium undetected cheats — instant delivery, always updated, trusted by thousands.
              </p>
              <div className="hero-cta-row">
                <a href="#store-section" className="hero-browse-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.949-1.35L24 0v11.4H10.949V2.099zM0 12.6h9.75v9.451L0 20.699V12.6zm10.949.001H24V24L10.949 22.1V12.601z"/>
                  </svg>
                  Purchase Now
                </a>
                <a href="https://discord.gg/6yGEKZC8aX" target="_blank" rel="noreferrer" className="hero-discord-btn">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/social/discord.png" alt="" width={18} height={18} style={{ filter: "brightness(0) invert(1)" }} />
                  Join Discord
                </a>
              </div>
            </div>

            {/* Right: product showcase slideshow */}
            <div className="hero-right">
              <HeroSlideshow slides={slideshowSlides} />
            </div>
          </div>
        </section>

        <section className="shell game-picker" id="store-section">
          <div className="categories-intro">
            <span className="categories-intro-pill">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              CATEGORIES
            </span>
            <h2>Popular Games</h2>
            <p>Find the perfect undetected cheat for your favorite game.</p>
          </div>

          {isLoading ? <SubpageSkeleton rows={6} /> : null}
          {!isLoading && error && <p className="state-message error">{error}</p>}
          {!isLoading && warningMessages.length ? (
            <div className="warn-box">
              {warningMessages.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <div className="game-grid frontpage-products-grid">
            {filteredGroups.filter(g => CATEGORY_IMAGES[canonicalGroupSlug(g.name)]).slice(0, 8).map((group, groupIndex) => {
              const groupSlug = canonicalGroupSlug(group.name);
              const staticImg = CATEGORY_IMAGES[groupSlug];
              const imageSrc = staticImg;
              const hasImage = Boolean(imageSrc);
              const isAboveFold = groupIndex < 3;
              const href = `/categories?slug=${encodeURIComponent(groupSlug)}`;

              return (
                <div key={group.id} className="game-card">
                  <div className="game-card-media">
                    {hasImage ? (
                      <Image
                        src={imageSrc}
                        alt={group.name}
                        width={400}
                        height={540}
                        sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 18vw"
                        priority={isAboveFold}
                        className="game-card-image"
                      />
                    ) : (
                      <div className="game-card-missing-media">
                        <strong>{group.name}</strong>
                      </div>
                    )}
                  </div>

                  {/* Buy Now button */}
                  <Link href={href} className="game-card-buy-btn">
                    BUY NOW
                  </Link>
                </div>
              );
            })}
          </div>

          {!isLoading && filteredGroups.length === 0 && (
            <p className="state-message">No categories are available yet.</p>
          )}
        </section>

        <section className="shell bendoo-cards-wrap" aria-label="Why choose Division">
          <header className="bendoo-cards-heading" aria-hidden="true">
            <h2>You&apos;ll Choose Us.</h2>
            <p>Because your Cheats should feel this good.</p>
          </header>

          <div className="bendoo-cards-list">
            <article className="bendoo-card bendoo-card-support">
              <div className="bendoo-support-hero" aria-hidden="true">
                <span className="bendoo-support-pulse bendoo-support-pulse-a" />
                <span className="bendoo-support-pulse bendoo-support-pulse-b" />
                <span className="bendoo-support-pulse bendoo-support-pulse-c" />
                <div className="bendoo-support-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3.2 5.7 5.8v5.3c0 4.2 2.3 7.8 6.3 9.7 4-1.9 6.3-5.5 6.3-9.7V5.8L12 3.2Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path d="m9.2 12.2 1.8 1.8 3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="bendoo-card-copy">
                <h3>Active Support</h3>
                <p>
                  No bots. No waiting days. You get real support, anytime. Our 24/7 team is ready
                  to help you instantly—whether it&apos;s setup or troubleshooting.
                </p>
              </div>
            </article>

            <article className="bendoo-card bendoo-card-safety">
              <div className="bendoo-badge-row">
                <span className="bendoo-badge bendoo-badge-safe">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3.6 6.3 6v4.9c0 3.8 2.2 7 5.7 8.8 3.5-1.8 5.7-5 5.7-8.8V6L12 3.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="m9.5 11.8 1.6 1.6 3.4-3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Safe
                </span>
                <span className="bendoo-badge bendoo-badge-streamproof">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4.4" y="6.5" width="15.2" height="10.8" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Streamproof
                </span>
              </div>
              <div className="bendoo-media-box" aria-hidden="true">
                <Image
                  src="/placeholders/bendoo-media-poster.jpg"
                  alt="Safety preview"
                  width={1200}
                  height={600}
                  className="bendoo-media-image"
                />
              </div>
              <div className="bendoo-card-copy">
                <h3>Your Safety Is Our Priority</h3>
                <p>
                  We prioritize cheat security with regular improvements to protect you at all times.
                </p>
              </div>
            </article>

            <article className="bendoo-card bendoo-card-community">
              <div className="bendoo-discord-icon-wrap" aria-hidden="true">
                <Image
                  src="/social/discord-card-icon.jpg"
                  alt="Discord"
                  width={110}
                  height={110}
                  className="bendoo-discord-icon"
                />
              </div>
              <div className="bendoo-card-copy">
                <h3>You&apos;re Never Alone</h3>
                <p>
                  Join players like you. Our Discord community is packed with people sharing tips,
                  clips, and ways to level up your game.
                </p>
              </div>
            </article>

            <article className="bendoo-card bendoo-card-updates" ref={bendooCardRef}>
              <div className="bendoo-dots-pattern" aria-hidden="true" />
              <div className="bendoo-progress-wrap" aria-hidden="true">
                <svg viewBox="0 0 220 220" className="bendoo-progress-ring">
                  <circle cx="110" cy="110" r="78" className="bendoo-progress-track" />
                  <circle
                    cx="110"
                    cy="110"
                    r="78"
                    className="bendoo-progress-value"
                    style={{ strokeDasharray: bendooProgressStroke }}
                    transform="rotate(-90 110 110)"
                  />
                </svg>
                <div className="bendoo-progress-inner">
                  <span>Updating Cheat...</span>
                  <strong>{bendooProgress}%</strong>
                </div>
              </div>
              <div className="bendoo-card-copy">
                <h3>Instant Cheat Updates</h3>
                <p>
                  Every time the game updates, we&apos;ve got your back. Your cheats are updated fast
                  to keep you winning.
                </p>
              </div>
            </article>

            <article className="bendoo-card bendoo-card-access">
              <div className="bendoo-grid-pattern" aria-hidden="true" />
              <div className="bendoo-access-button" aria-hidden="true">
                <span>ACCESS</span>
                <svg viewBox="0 0 24 24" fill="none" className="bendoo-access-cursor">
                  <path
                    d="M5.5 3.8 17 11.9l-4.6.8 1.9 5.6-2.4.8-2-5.8-3.7 2.9L5.5 3.8Z"
                    fill="#05080E"
                    stroke="#FFFFFF"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="bendoo-card-copy">
                <h3>Instant Cheat Access</h3>
                <p>
                  The moment you check out, you&apos;re in. No delays. No waiting. Just your cheat,
                  activated and ready to dominate.
                </p>
              </div>
            </article>

            <article className="bendoo-card bendoo-card-streamproof">
              <div className="bendoo-media-box bendoo-media-box-stream" aria-hidden="true">
                <video
                  className="bendoo-media-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="none"
                  poster="/placeholders/bendoo-media-poster.jpg"
                >
                  <source src="/placeholders/bendoo-card2-loop.mp4" type="video/mp4" />
                </video>
                <span className="bendoo-streamproof-overlay">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4.4" y="6.4" width="15.2" height="10.8" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <div className="bendoo-card-copy">
                <h3>Streamproof &amp; External</h3>
                <p>
                  Our cheats are fully external and kernel-based—built to be safe and completely
                  stream-proof.
                </p>
              </div>
            </article>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
    </StorefrontProvider>
  );
}
