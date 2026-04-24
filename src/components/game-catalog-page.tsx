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

export function GameCatalogPage({ group, products }: GameCatalogPageProps) {
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
                      <div className={styles.productCardHeading}>
                        <h2 className={styles.productCardName}>{product.name}</h2>
                        <div className={styles.productCardPriceBlock}>
                          <span className={styles.productCardFrom}>FROM</span>
                          <span className={styles.productCardPrice}>{money(price, product.currency || "USD")}</span>
                        </div>
                      </div>

                      <span className={`${styles.statusBadge} ${
                        status === "updated"  ? styles.statusUpdated  :
                        status === "updating" ? styles.statusUpdating :
                                                styles.statusFrozen
                      }`}>
                        {status === "updated" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )}
                        {status === "updating" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                          </svg>
                        )}
                        {status === "frozen" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
                            <line x1="20" y1="4" x2="4" y2="20"/><line x1="4" y1="4" x2="20" y2="20"/>
                          </svg>
                        )}
                        {status === "updated"  ? "UNDETECTED (WORKING)"   :
                         status === "updating" ? "UPDATING (NOT WORKING)" :
                                                 "FROZEN (UNAVAILABLE)"}
                      </span>

                      <span className={styles.buyButton}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Buy Now
                      </span>
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
      </main>

      <SiteFooter />
    </div>
  );
}
