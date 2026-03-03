"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { toGameSlug } from "@/lib/game-slug";
import { productHref } from "@/lib/product-route";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import { formatStorefrontWarnings } from "@/lib/storefront-warnings";
import type { SellAuthGroup, SellAuthProduct, StorefrontData } from "@/types/sellauth";

function normalized(value: string): string {
  return value.toLowerCase().trim();
}

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
  const slug = toGameSlug(value || "");
  const compact = slug.replace(/-/g, "");

  if (
    compact === "r6" ||
    compact === "r6s" ||
    compact.includes("rainbowsixsiege") ||
    compact.includes("rainbow6siege") ||
    compact.includes("rainbowsixseige") ||
    compact.includes("rainbow6seige")
  ) {
    return "rainbow-six-siege";
  }

  if (compact === "lol" || compact.includes("leagueoflegends")) {
    return "league-of-legends";
  }

  if (compact === "cs2" || compact.includes("counterstrike2")) {
    return "counter-strike-2";
  }

  if (compact.includes("apexlegends")) {
    return "apex";
  }

  return slug;
}

const HIDDEN_GROUP_SLUGS = new Set(["valorant", "pubg"]);

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

function isStockAvailable(product: SellAuthProduct): boolean {
  if (typeof product.stock === "number") return product.stock > 0;
  return true;
}

export function StorefrontClient() {
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

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

    const groups =
      baseGroups.length > 0
        ? baseGroups
        : categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
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
        if (slug === "league-of-legends") return false;
        if (HIDDEN_GROUP_SLUGS.has(slug)) return false;
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
    if (activeGroupId === null) return null;
    return storefront?.groups.find((group) => group.id === activeGroupId) || null;
  }, [activeGroupId, storefront]);

  const activeGroupProducts = useMemo(() => {
    if (!storefront || !activeGroup) return [];
    const activeName = normalized(activeGroup.name);
    const activeSlug = toGameSlug(activeGroup.name);

    return storefront.products
      .filter((product) => {
        if (product.groupId !== null && product.groupId === activeGroup.id) return true;
        if (product.categoryId !== null && product.categoryId === activeGroup.id) return true;
        if (normalized(product.groupName) === activeName) return true;
        if (normalized(product.categoryName) === activeName) return true;
        if (toGameSlug(product.groupName || "") === activeSlug) return true;
        if (toGameSlug(product.categoryName || "") === activeSlug) return true;
        return false;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeGroup, storefront]);

  const warningMessages = useMemo(
    () => formatStorefrontWarnings(storefront?.warnings || []),
    [storefront?.warnings]
  );

  useEffect(() => {
    if (activeGroupId === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGroupId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeGroupId]);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main id="top">
        <section className="hero">
          <div className="hero-bg" />
          <div className="shell hero-content">
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="hero-title-row hero-line-primary">Upgrade Your</span>
                <span className="hero-title-row hero-line-accent">Gameplay</span>
              </h1>
              <p className="hero-subtext">
                <span>
                  Access Custom Mods, Tools, and Enhancements for a Better Experience.
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
              const baseSrcRaw = group.image?.url?.trim() || "";
              const hasImage = Boolean(baseSrcRaw);
              const hoverSrcRaw = hasImage ? hoverImageFor(baseSrcRaw) : "";
              const version = storefront?.fetchedAt || "category-v2";
              const baseSrc = hasImage ? withVersion(baseSrcRaw, version) : "";
              const hoverSrc = hasImage ? withVersion(hoverSrcRaw, version) : "";

              return (
                <Link
                  key={group.id}
                  href={`/categories?slug=${encodeURIComponent(toGameSlug(group.name))}`}
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
                    setActiveGroupId(group.id);
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
                          className="game-card-image game-card-image--base"
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
                          className="game-card-image game-card-image--hover"
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

        {activeGroup ? (
          <div
            className="category-modal-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setActiveGroupId(null);
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
                  onClick={() => setActiveGroupId(null)}
                >
                  ×
                </button>
              </header>

              {activeGroupProducts.length > 0 ? (
                <div className="category-modal-grid">
                  {activeGroupProducts.map((product) => {
                    const price = productLowestPrice(product);
                    const inStock = isStockAvailable(product);
                    const productImage = withVersion(
                      product.image || "/placeholders/product-image-not-added.svg",
                      storefront?.fetchedAt || "modal-v1"
                    );

                    return (
                      <Link
                        key={product.id}
                        href={productHref(product)}
                        className="category-modal-product"
                        onClick={() => setActiveGroupId(null)}
                      >
                        <span className="category-modal-product-image">
                          <Image
                            src={productImage}
                            alt={product.name}
                            width={640}
                            height={360}
                            sizes="(max-width: 900px) 100vw, 33vw"
                            unoptimized
                          />
                        </span>

                        <span className="category-modal-product-body">
                          <span className="category-modal-product-top">
                            <h4>{product.name}</h4>
                            <span
                              className={`category-modal-status ${
                                inStock
                                  ? "category-modal-status-ok"
                                  : "category-modal-status-low"
                              }`}
                            >
                              {inStock ? "Operational" : "Unavailable"}
                            </span>
                          </span>

                          <span className="category-modal-meta">
                            <span className="category-modal-meta-box">
                              <span>From</span>
                              <strong>{money(price, product.currency || "USD")}</strong>
                            </span>
                            <span className="category-modal-meta-box">
                              <span>Stock</span>
                              <strong>{inStock ? "In Stock" : "Out of Stock"}</strong>
                            </span>
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
