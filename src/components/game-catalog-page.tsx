"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toGameSlug } from "@/lib/game-slug";
import type { SellAuthGroup, SellAuthProduct } from "@/types/sellauth";
import styles from "./game-catalog-page.module.css";

interface GameCatalogPageProps {
  group: SellAuthGroup;
  products: SellAuthProduct[];
}

const GROUP_VIDEO_BY_SLUG: Record<string, string> = {
  fortnite: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
  rust: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
  "call-of-duty": "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
  "hwid-spoofer": "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
};

function normalized(value: string): string {
  return value.toLowerCase().trim();
}

function money(value: number | null, currency = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function productPrice(product: SellAuthProduct): number | null {
  if (typeof product.price === "number") return product.price;
  if (product.variants.length > 0) return product.variants[0].price;
  return null;
}

function scoreFromId(id: number, salt: number, min: number, max: number): number {
  const seed = Math.abs((id * salt) % 100) / 100;
  return min + seed * (max - min);
}

function ratingFor(product: SellAuthProduct): number {
  return Number(scoreFromId(product.id, 17, 3.6, 5).toFixed(1));
}

function starsFor(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function statusFor(product: SellAuthProduct): "updated" | "updating" | "frozen" {
  if (typeof product.stock === "number") {
    if (product.stock <= 0) return "frozen";
    if (product.stock <= 20) return "updating";
    return "updated";
  }
  const fallback = Math.abs(product.id) % 3;
  if (fallback === 0) return "updated";
  if (fallback === 1) return "updating";
  return "frozen";
}

function statusLabel(status: "updated" | "updating" | "frozen"): string {
  if (status === "updated") return "Updated";
  if (status === "updating") return "Updating";
  return "Frozen";
}

function securityStars(product: SellAuthProduct): number {
  return starsFor(scoreFromId(product.id, 11, 3.4, 5));
}

function functionalityStars(product: SellAuthProduct): number {
  return starsFor(scoreFromId(product.id, 23, 3.2, 5));
}

function videoForGroup(groupName: string): string {
  const slug = toGameSlug(groupName);
  return GROUP_VIDEO_BY_SLUG[slug] || "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";
}

function StarRow({ value }: { value: number }) {
  return (
    <span className={styles.starRow} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={styles.starGlyph}>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            className={index < value ? styles.starActive : styles.starIdle}
            aria-hidden="true"
          >
            <path
              d="m12 2.4 2.9 5.88 6.48.95-4.69 4.57 1.11 6.46L12 17.2l-5.8 3.06 1.1-6.46L2.6 9.23l6.5-.95L12 2.4Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

export function GameCatalogPage({ group, products }: GameCatalogPageProps) {
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const filteredProducts = useMemo(() => {
    const keyword = normalized(query);
    if (!keyword) return products;
    return products.filter((product) =>
      normalized(`${product.name} ${product.description}`).includes(keyword)
    );
  }, [products, query]);

  const activeProduct = useMemo(() => {
    if (filteredProducts.length === 0) return null;
    return (
      filteredProducts.find((product) => product.id === selectedProductId) ||
      filteredProducts[0]
    );
  }, [filteredProducts, selectedProductId]);

  useEffect(() => {
    if (!activeProduct || !videoRef.current) return;
    const video = videoRef.current;
    video.currentTime = 0;
    const playback = video.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {});
    }
  }, [activeProduct]);

  const heroImage = group.image?.url || "/games/fortnite.svg";
  const previewVideo = videoForGroup(group.name);
  const lowestPrice = useMemo(() => {
    if (products.length === 0) return null;
    return products.reduce<number | null>((min, product) => {
      const value = productPrice(product);
      if (value === null) return min;
      if (min === null) return value;
      return value < min ? value : min;
    }, null);
  }, [products]);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main className={styles.pageShell}>
        <section className={styles.hero}>
          <div
            className={styles.heroBackdrop}
            style={{
              backgroundImage: `url("${heroImage}")`,
            }}
          />
          <div className={styles.heroCenter}>
            <div className={styles.gameBadge}>
              <Image
                src={heroImage}
                alt={group.name}
                width={92}
                height={92}
                sizes="92px"
              />
            </div>
          </div>
        </section>

        <section className={styles.catalogSection}>
          <Link className={styles.catalogBackLink} href="/#store-section">
            Games catalog
          </Link>

          <header className={styles.catalogHeader}>
            <h1>Cheats {group.name}</h1>
            <div className={styles.catalogHighlights}>
              <span>Private cheats</span>
              <span>
                Price for {group.name} cheats from{" "}
                {lowestPrice === null ? "N/A" : money(lowestPrice, products[0]?.currency || "USD")}
              </span>
              <span>Best {group.name.toLowerCase()} cheats</span>
            </div>
          </header>

          <label className={styles.searchWrap}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label={`Search ${group.name} products`}
            />
          </label>

          <div className={styles.catalogGrid}>
            <aside className={styles.productListPanel}>
              <div className={styles.productList}>
                {filteredProducts.map((product) => {
                  const price = productPrice(product);
                  const isActive = activeProduct?.id === product.id;
                  const status = statusFor(product);
                  let statusClass = styles.statusFrozen;
                  if (status === "updated") statusClass = styles.statusUpdated;
                  if (status === "updating") statusClass = styles.statusUpdating;
                  return (
                    <button
                      key={product.id}
                      className={`${styles.productListItem} ${
                        isActive ? styles.productListItemActive : ""
                      }`}
                      onMouseEnter={() => setSelectedProductId(product.id)}
                      onFocus={() => setSelectedProductId(product.id)}
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <div className={styles.productThumb}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={62}
                          height={62}
                          sizes="62px"
                        />
                      </div>
                      <div className={styles.productSummary}>
                        <div className={styles.productTopLine}>
                          <strong>{product.name}</strong>
                          <span>
                            from {money(price, product.currency)}
                          </span>
                        </div>
                        <p className={styles.metrics}>
                          Security: <StarRow value={securityStars(product)} />
                        </p>
                        <p className={styles.metrics}>
                          Functional: <StarRow value={functionalityStars(product)} />
                        </p>
                        <p className={styles.tags}>
                          <span className={`${styles.statusPill} ${statusClass}`}>
                            {statusLabel(status)}
                          </span>
                        </p>
                        <p className={styles.windowsVersion}>Windows 10 / 11</p>
                      </div>
                    </button>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <p className={styles.emptyState}>
                    No products found for this search.
                  </p>
                )}
              </div>
            </aside>

            <article className={styles.previewCard}>
              {activeProduct ? (
                <>
                  <h2>{activeProduct.name}</h2>
                  <div className={styles.previewMedia}>
                    <video
                      key={activeProduct.id}
                      ref={videoRef}
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={activeProduct.image}
                    >
                      <source src={previewVideo} type="video/mp4" />
                    </video>
                  </div>

                  <p className={styles.previewText}>
                    {activeProduct.description ||
                      `${activeProduct.name} is tuned for competitive play with stable updates and fast support.`}
                  </p>

                  <div className={styles.previewRating}>
                    <StarRow value={starsFor(ratingFor(activeProduct))} />
                    <span>(Rated: {Math.round(ratingFor(activeProduct) * 10)})</span>
                  </div>

                  <Link href={`/products/${activeProduct.id}`} className={styles.previewCta}>
                    Learn more and buy
                  </Link>
                </>
              ) : (
                <p className={styles.emptyState}>No products available in this game yet.</p>
              )}
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
