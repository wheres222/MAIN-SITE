"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { canonicalGameSlug } from "@/lib/game-slug";
import { productHref } from "@/lib/product-route";
import type { SellAuthGroup, SellAuthProduct } from "@/types/sellauth";
import styles from "./game-catalog-page.module.css";

interface GameCatalogPageProps {
  group: SellAuthGroup;
  products: SellAuthProduct[];
  /** Optional SEO content rendered between the hero and the product grid. */
  seoContent?: React.ReactNode;
  /** Optional SEO content rendered below the product grid (FAQ, related games). */
  seoFooter?: React.ReactNode;
}

const BANNER_SLUGS = new Set([
  "apex",
  "arc-raiders",
  "call-of-duty",
  "counter-strike-2",
  "delta-force",
  "escape-from-tarkov",
  "rainbow-six-siege",
  "rust",
  "rocket-league",
  "valorant",
  "fortnite",
  "hwid-spoofers",
]);

function heroBannerFor(groupName: string): string {
  const slug = canonicalGameSlug(groupName);
  if (BANNER_SLUGS.has(slug)) return `/banners/${slug}.webp`;
  return "/placeholders/category-banner-not-added.svg";
}

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

function statusFor(_product: SellAuthProduct): "updated" | "updating" | "frozen" {
  return "updated";
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

export function GameCatalogPage({ group, products, seoContent, seoFooter }: GameCatalogPageProps) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = normalized(query);
    if (!keyword) return products;
    return products.filter((product) =>
      normalized(`${product.name} ${product.description}`).includes(keyword)
    );
  }, [products, query]);

  const heroImage = heroBannerFor(group.name);
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
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
        </section>

        {seoContent}

        <section className={styles.catalogSection}>
          <div className={styles.productCardsGrid}>
            {filteredProducts.map((product) => {
              const price = productPrice(product);
              const status = statusFor(product);

              return (
                <article key={product.id} className={styles.productCard}>
                  <Link href={productHref(product)} className={styles.productCardLink}>
                    {/* Image */}
                    <div className={styles.productCardMedia}>
                      <Image
                        src={product.image || "/placeholders/product-image-not-added.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 780px) 100vw, (max-width: 1100px) 50vw, 33vw"
                        className={styles.productCardImage}
                      />
                    </div>

                    {/* Body */}
                    <div className={styles.productCardBody}>
                      <h2 className={styles.productCardName}>{product.name}</h2>

                      <span className={`${styles.statusBadge} ${
                        status === "updated"  ? styles.statusUpdated  :
                        status === "updating" ? styles.statusUpdating :
                                                styles.statusFrozen
                      }`}>
                        {status === "updated" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        )}
                        {status === "updating" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                          </svg>
                        )}
                        {status === "frozen" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                          </svg>
                        )}
                        {status === "updated"  ? "UNDETECTED (WORKING)"   :
                         status === "updating" ? "UPDATING (NOT WORKING)" :
                                                 "DETECTED"}
                      </span>

                      <div className={styles.productCardFooter}>
                        <div className={styles.productCardPriceBlock}>
                          <span className={styles.productCardFrom}>STARTING AT</span>
                          <span className={styles.productCardPrice}>
                            {money(price, product.currency || "USD")}
                          </span>
                        </div>
                        <span className={styles.buyButton}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}

            {filteredProducts.length === 0 && (
              <p className={styles.emptyState}>
                No products found for this category.
              </p>
            )}
          </div>
        </section>

        {seoFooter}
      </main>

      <SiteFooter />
    </div>
  );
}
