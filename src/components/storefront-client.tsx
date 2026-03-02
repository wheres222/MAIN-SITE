"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toGameSlug } from "@/lib/game-slug";
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
        const response = await fetch("/api/storefront");
        const data = (await response.json()) as StorefrontData;
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
    const groups = storefront?.groups || [];
    if (groups.length > 0) {
      return [...groups].sort((a, b) => a.name.localeCompare(b.name));
    }

    const categories = storefront?.categories || [];
    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
                <span className="hero-title-row hero-line-primary">
                  Undetected Cheats
                </span>
                <span className="hero-title-row hero-line-accent">
                  Play Without Limits.
                </span>
              </h1>
              <p className="hero-subtext">
                <span>Check Status, Reviews, and Support anytime while browsing live categories.</span>
                <span>Open any product to continue to checkout in seconds.</span>
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

          {isLoading && <p className="state-message">Loading storefront data...</p>}
          {!isLoading && error && <p className="state-message error">{error}</p>}
          {!isLoading && storefront?.warnings.length ? (
            <div className="warn-box">
              {storefront.warnings.map((warning) => (
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
                        href={`/products?id=${product.id}`}
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
