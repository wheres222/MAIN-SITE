"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { canonicalGameSlug } from "@/lib/game-slug";
import { getDiscordUrl } from "@/lib/links";
import { productHref } from "@/lib/product-route";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
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

function withVersion(source: string, version: string): string {
  const joiner = source.includes("?") ? "&" : "?";
  return `${source}${joiner}v=${encodeURIComponent(version)}`;
}

function canonicalGroupSlug(value: string): string {
  return canonicalGameSlug(value || "");
}

const HIDDEN_GROUP_SLUGS = new Set([
  "valorant",
  "pubg",
  "fivem",
  "call-of-duty",
  "roblox",
]);

const PRIORITY_GROUP_ORDER = [
  "rust",
  "arc-raiders",
  "call-of-duty",
  "fortnite",
  "fivem",
  "dayz",
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
  return slug === "accounts" || slug === "vpns" || slug === "vpn";
}

export function StorefrontClient() {
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeGroupSlug, setActiveGroupSlug] = useState<string | null>(null);
  const discordUrl = getDiscordUrl();

  useEffect(() => {
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
  }, []);

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
    ];

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
        if (slug === "league-of-legends") return false;
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

  const activeGroup = useMemo<SellAuthGroup | null>(() => {
    if (!activeGroupSlug) return null;
    return (
      filteredGroups.find((group) => canonicalGroupSlug(group.name) === activeGroupSlug) ||
      null
    );
  }, [activeGroupSlug, filteredGroups]);

  const activeGroupProducts = useMemo(() => {
    if (!storefront || !activeGroupSlug) return [];

    const relatedGroupIds = new Set<number>();

    for (const group of storefront.groups || []) {
      if (canonicalGroupSlug(group.name) === activeGroupSlug) {
        relatedGroupIds.add(group.id);
      }
    }

    for (const category of storefront.categories || []) {
      if (canonicalGroupSlug(category.name) === activeGroupSlug) {
        relatedGroupIds.add(category.id);
      }
    }

    return storefront.products
      .filter((product) => {
        if (product.groupId !== null && relatedGroupIds.has(product.groupId)) return true;
        if (product.categoryId !== null && relatedGroupIds.has(product.categoryId)) return true;
        if (canonicalGroupSlug(product.groupName || "") === activeGroupSlug) return true;
        if (canonicalGroupSlug(product.categoryName || "") === activeGroupSlug) return true;
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeGroupSlug, storefront]);

  const warningMessages = useMemo(
    () => formatStorefrontWarnings(storefront?.warnings || []),
    [storefront?.warnings]
  );

  useEffect(() => {
    if (activeGroupSlug === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGroupSlug(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeGroupSlug]);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main id="top">
        <section className="hero">
          <div className="hero-bg" />
          <div className="shell hero-content">
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="hero-title-row hero-line-primary">The #1 Marketplace</span>
                <span className="hero-title-row hero-line-accent">for your unfair advantage</span>
              </h1>
              <p className="hero-subtext">
                <span>
                  Access high quality cheats, accounts, and tools to gain the edge.
                </span>
              </p>
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
            {filteredGroups.map((group) => {
              const groupSlug = canonicalGroupSlug(group.name);
              const baseSrcRaw = group.image?.url?.trim() || "";
              const hasImage = Boolean(baseSrcRaw);
              const hoverSrcRaw = hasImage ? hoverImageFor(baseSrcRaw) : "";
              const version = storefront?.fetchedAt || "category-v2";
              const baseSrc = hasImage ? withVersion(baseSrcRaw, version) : "";
              const hoverSrc = hasImage ? withVersion(hoverSrcRaw, version) : "";
              const containImage = shouldContainCategoryImage(groupSlug);

              return (
                <Link
                  key={group.id}
                  href={`/categories?slug=${encodeURIComponent(groupSlug)}`}
                  className="game-card"
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    ) {
                      return;
                    }
                    event.preventDefault();
                    setActiveGroupSlug(groupSlug);
                  }}
                >
                  <div className="game-card-media">
                    {hasImage ? (
                      <>
                        <Image
                          src={baseSrc}
                          alt={group.name}
                          width={600}
                          height={600}
                          sizes="(max-width: 900px) 90vw, (max-width: 1400px) 45vw, 30vw"
                          priority={false}
                          unoptimized
                          className={`game-card-image game-card-image--base ${
                            containImage ? "game-card-image--contain" : ""
                          }`}
                        />
                        <Image
                          src={hoverSrc}
                          alt=""
                          aria-hidden="true"
                          width={600}
                          height={600}
                          sizes="(max-width: 900px) 90vw, (max-width: 1400px) 45vw, 30vw"
                          priority={false}
                          unoptimized
                          className={`game-card-image game-card-image--hover ${
                            containImage ? "game-card-image--contain" : ""
                          }`}
                        />
                      </>
                    ) : (
                      <div className="game-card-missing-media">
                        <strong>{group.name}</strong>
                        <p>Product image not added</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {!isLoading && filteredGroups.length === 0 && (
            <p className="state-message">No categories are available yet.</p>
          )}
        </section>

        <section className="shell bendoo-cards-wrap" aria-label="Why choose Division">
          <div className="bendoo-cards-list">
            <article className="bendoo-card bendoo-card-support">
              <div className="bendoo-support-rings" aria-hidden="true" />
              <div className="bendoo-support-icon-wrap" aria-hidden="true">
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
              <div className="bendoo-card-copy">
                <h3>Division Supports You</h3>
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
                  src="/placeholders/product-image-not-added.svg"
                  alt="Safety preview placeholder"
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
              <div className="bendoo-network" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="bendoo-discord-icon-wrap" aria-hidden="true">
                <Image
                  src="/social/discord.png"
                  alt="Discord"
                  width={56}
                  height={56}
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

            <article className="bendoo-card bendoo-card-updates">
              <div className="bendoo-dots-pattern" aria-hidden="true" />
              <div className="bendoo-progress-wrap" aria-hidden="true">
                <svg viewBox="0 0 220 220" className="bendoo-progress-ring">
                  <circle cx="110" cy="110" r="78" className="bendoo-progress-track" />
                  <circle
                    cx="110"
                    cy="110"
                    r="78"
                    className="bendoo-progress-value"
                    style={{ strokeDasharray: "102.9 490.1" }}
                    transform="rotate(-90 110 110)"
                  />
                </svg>
                <div className="bendoo-progress-inner">
                  <span>Updating Cheat...</span>
                  <strong>21%</strong>
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
                  <path d="M5.5 3.8 17 11.9l-4.6.8 1.9 5.6-2.4.8-2-5.8-3.7 2.9L5.5 3.8Z" fill="currentColor" />
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
                <Image
                  src="/placeholders/product-image-not-added.svg"
                  alt="Streamproof preview placeholder"
                  width={1200}
                  height={600}
                  className="bendoo-media-image"
                />
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

        <section className="shell discord-join-wrap" aria-label="Join Discord">
          <a
            className="discord-join-banner"
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            <div className="discord-join-copy">
              <h3>Join Our Discord</h3>
              <p>Connect with our community for support, updates, and exclusive offers.</p>
              <span className="discord-join-cta">Join Now</span>
            </div>
          </a>
        </section>

        {activeGroup ? (
          <div
            className="category-modal-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setActiveGroupSlug(null);
              }
            }}
          >
            <section
              className="category-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`category-modal-title-${activeGroup.id}`}
            >
              <header className="category-modal-header">
                <h3 id={`category-modal-title-${activeGroup.id}`}>
                  {activeGroup.name} Products
                </h3>
                <button
                  type="button"
                  className="category-modal-close"
                  aria-label="Close products popup"
                  onClick={() => setActiveGroupSlug(null)}
                >
                  ×
                </button>
              </header>

              {activeGroupProducts.length > 0 ? (
                <div className="category-modal-grid">
                  {activeGroupProducts.map((product) => {
                    const price = productLowestPrice(product);
                    const productImage = withVersion(
                      product.image || "/placeholders/product-image-not-added.svg",
                      storefront?.fetchedAt || "modal-v1"
                    );

                    return (
                      <Link
                        key={product.id}
                        href={productHref(product)}
                        className="category-modal-product"
                        onClick={() => setActiveGroupSlug(null)}
                      >
                        <span className="category-modal-product-image">
                          <span className="category-modal-product-image-wrap">
                            <Image
                              src={productImage}
                              alt={product.name}
                              width={600}
                              height={600}
                              sizes="(max-width: 900px) 100vw, 33vw"
                              unoptimized
                            />
                          </span>
                        </span>

                        <span className="category-modal-product-body">
                          <span className="category-modal-product-top">
                            <h4>{product.name}</h4>
                          </span>

                          <span className="category-modal-meta">
                            <span className="category-modal-meta-box">
                              <span>From</span>
                              <strong>{money(price, product.currency || "USD")}</strong>
                            </span>
                          </span>

                          <span className="category-modal-buy-now">
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M5.4 7.8h13.2l-1.2 9.8H6.6L5.4 7.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                              <path d="M9.1 7.8V6.7a2.9 2.9 0 1 1 5.8 0v1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                            Buy now
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="category-modal-empty">
                  No products are available for this category yet.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
