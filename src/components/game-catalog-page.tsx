"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toGameSlug } from "@/lib/game-slug";
import { productHref } from "@/lib/product-route";
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

  const filteredProducts = useMemo(() => {
    const keyword = normalized(query);
    if (!keyword) return products;
    return products.filter((product) =>
      normalized(`${product.name} ${product.description}`).includes(keyword)
    );
  }, [products, query]);

  const heroImage = "/placeholders/category-banner-not-added.svg";
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

              return (
                <article key={product.id} className={styles.productCard}>
                  <Link href={productHref(product)} className={styles.productCardLink}>
                    <div className={styles.productCardMedia}>
                      <Image
                        src={product.image || "/placeholders/product-image-not-added.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        className={styles.productCardImage}
                      />
                    </div>
                    <div className={styles.productCardBody}>
                      <div className={styles.productCardHeading}>
                        <h2>{product.name}</h2>
                        <span className={styles.productCardPrice}>FROM {money(price, product.currency || "USD")}</span>
                      </div>
                      <span className={styles.buyButton}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
