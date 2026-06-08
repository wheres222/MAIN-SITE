"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { productHref } from "@/lib/product-route";
import type { SellAuthGroup, SellAuthProduct } from "@/types/sellauth";
import styles from "./game-catalog-page.module.css";

interface GameCatalogPageProps {
  group: SellAuthGroup;
  products: SellAuthProduct[];
  seoContent?: React.ReactNode;
  seoFooter?: React.ReactNode;
}

function money(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function priceRange(product: SellAuthProduct): { min: number; max: number } | null {
  const prices: number[] = [];
  if (typeof product.price === "number") prices.push(product.price);
  for (const v of product.variants) if (typeof v.price === "number") prices.push(v.price);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Deterministic pseudo-values so a product always shows the same rating/reviews.
function seeded(id: number, salt: number, min: number, max: number): number {
  const seed = Math.abs((id * salt) % 1000) / 1000;
  return min + seed * (max - min);
}
function ratingFor(p: SellAuthProduct): number { return Number(seeded(p.id, 37, 4.55, 4.95).toFixed(2)); }
function reviewsFor(p: SellAuthProduct): number { return Math.round(seeded(p.id, 53, 40, 620) / 5) * 5; }

function archTag(p: SellAuthProduct): string | null {
  const text = `${p.name} ${p.description ?? ""}`.toLowerCase();
  if (/\binternal\b/.test(text)) return "Internal";
  if (/\bexternal\b/.test(text)) return "External";
  return null;
}

function StarRow({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className={styles.stars} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="15" height="15" className={i < filled ? styles.starOn : styles.starOff} aria-hidden="true">
          <path d="m12 2.4 2.9 5.88 6.48.95-4.69 4.57 1.11 6.46L12 17.2l-5.8 3.06 1.1-6.46L2.6 9.23l6.5-.95L12 2.4Z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

const IconOS = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M8 20h8M10 17v3M14 17v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconCPU = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const IconShield = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function GameCatalogPage({ group, products, seoContent, seoFooter }: GameCatalogPageProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return kw ? products.filter((p) => p.name.toLowerCase().includes(kw)) : products;
  }, [products, query]);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main className={styles.pageShell}>
        {/* Header */}
        <header className={styles.head}>
          <h1 className={styles.headTitle}>{group.name}</h1>
          <p className={styles.headSub}>Get more information about {group.name} Cheats</p>
        </header>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.crumbSep}>/</span>
          <Link href="/products">Store</Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCurrent}>{group.name}</span>
        </nav>

        {/* Search */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <input className={styles.search} type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
          </div>
        </div>

        {/* Product rows */}
        <div className={styles.rows}>
          {filtered.map((product) => {
            const range = priceRange(product);
            const rating = ratingFor(product);
            const reviews = reviewsFor(product);
            const arch = archTag(product);
            return (
              <article key={product.id} className={styles.row}>
                <Link href={productHref(product)} className={styles.rowImg} aria-label={product.name}>
                  <Image
                    src={product.image || "/placeholders/product-image-not-added.svg"}
                    alt={product.name}
                    width={320}
                    height={200}
                    sizes="(max-width: 760px) 100vw, 300px"
                    className={styles.rowImgEl}
                  />
                </Link>

                <div className={styles.rowMid}>
                  <Link href={productHref(product)} className={styles.rowName}>{product.name}</Link>

                  <div className={styles.tags}>
                    {arch && <span className={styles.tag}>{arch}</span>}
                    <span className={styles.tag}>Instant Delivery</span>
                  </div>

                  <div className={styles.specs}>
                    <span className={styles.spec}>{IconOS} Windows 10, 11</span>
                    <span className={styles.spec}>{IconCPU} Intel / AMD</span>
                    <span className={styles.statusOk}>{IconShield} Undetected</span>
                  </div>

                  <div className={styles.rating}>
                    <StarRow value={rating} />
                    <span className={styles.ratingNum}>{rating.toFixed(2)}</span>
                    <span className={styles.ratingCount}>/ {reviews}+</span>
                  </div>
                </div>

                <div className={styles.rowRight}>
                  {range && (
                    <span className={styles.price}>
                      {range.min === range.max
                        ? `From ${money(range.min, product.currency || "USD")}`
                        : `From ${money(range.min, product.currency || "USD")} to ${money(range.max, product.currency || "USD")}`}
                    </span>
                  )}
                  <Link href={productHref(product)} className={styles.purchase}>Purchase</Link>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <p className={styles.empty}>No products found{query ? " for your search" : " for this category"}.</p>
          )}
        </div>

        {seoContent}
        {seoFooter}
      </main>

      <SiteFooter />
    </div>
  );
}
