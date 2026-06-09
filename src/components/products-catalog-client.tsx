"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { productHref } from "@/lib/product-route";
import { categoryHref } from "@/lib/category-href";
import { canonicalGameSlug } from "@/lib/game-slug";
import { CATEGORY_IMAGES, CATEGORY_TILES } from "@/lib/category-images";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";
import styles from "./products-catalog.module.css";

const PLACEHOLDER = "/placeholders/category-banner-not-added.svg";

function money(value: number | null, currency = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function productPrice(product: SellAuthProduct): number | null {
  if (typeof product.price === "number") return product.price;
  if (product.variants.length > 0) return product.variants[0].price;
  return null;
}

interface Group {
  slug: string;
  name: string;
  image: string;
  products: SellAuthProduct[];
}

function isCheatProduct(slug: string): boolean {
  return !/(^account|^vpn|^discord|^misc)/.test(slug);
}

export function ProductsCatalogClient() {
  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let alive = true;
    fetchStorefrontClient()
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Build per-game groups from the product list.
  const allGroups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const p of data?.products ?? []) {
      const rawName = (p.groupName || p.categoryName || "Other").trim();
      const slug = canonicalGameSlug(rawName) || "other";
      let g = map.get(slug);
      if (!g) {
        g = { slug, name: rawName, image: CATEGORY_IMAGES[slug] || p.image || PLACEHOLDER, products: [] };
        map.set(slug, g);
      }
      g.products.push(p);
    }
    const priorityOrder = CATEGORY_TILES.map((t) => t.slug);
    return [...map.values()].sort((a, b) => {
      const ai = priorityOrder.indexOf(a.slug);
      const bi = priorityOrder.indexOf(b.slug);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  // Apply category + search filters.
  const groups = useMemo<Group[]>(() => {
    const kw = query.trim().toLowerCase();
    return allGroups
      .filter((g) => category === "all" || g.slug === category)
      .map((g) => ({
        ...g,
        products: kw
          ? g.products.filter((p) => p.name.toLowerCase().includes(kw))
          : g.products,
      }))
      .filter((g) => g.products.length > 0);
  }, [allGroups, category, query]);

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />

      <main className={styles.shell}>
        {/* Controls: skinny search + category filter */}
        <div className={styles.controls}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <select
            className={styles.filter}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {allGroups.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <SubpageSkeleton rows={5} />
        ) : groups.length === 0 ? (
          <p className={styles.empty}>No products match your search.</p>
        ) : (
          <div className={styles.rows}>
            {groups.map((g) => (
              <section key={g.slug} id={`cat-${g.slug}`} className={styles.row}>
                {/* Left: category image card */}
                <Link href={categoryHref(g.slug)} className={styles.catCard}>
                  <span className={styles.catName}>{g.name}</span>
                  <Image
                    className={styles.catImg}
                    src={g.image}
                    alt={`${g.name} cheats`}
                    width={300}
                    height={170}
                    sizes="(max-width: 760px) 100vw, 240px"
                  />
                </Link>

                {/* Right: products */}
                <div className={styles.products}>
                  {g.products.map((product) => {
                    const price = productPrice(product);
                    return (
                      <Link key={product.id} href={productHref(product)} className={styles.pcard}>
                        <div className={styles.pcardImgWrap}>
                          <Image
                            className={styles.pcardImg}
                            src={product.image || "/placeholders/product-image-not-added.svg"}
                            alt={product.name}
                            width={400}
                            height={225}
                            sizes="(max-width: 760px) 100vw, 33vw"
                          />
                          {isCheatProduct(g.slug) && (
                            <span className={styles.pcardBadge}>
                              <span className={styles.pcardDot} aria-hidden="true" />
                              Undetected
                            </span>
                          )}
                        </div>
                        <div className={styles.pcardFoot}>
                          <span className={styles.pcardMeta}>
                            <span className={styles.pcardName}>{product.name}</span>
                            {price !== null && (
                              <span className={styles.pcardPrice}>from {money(price, product.currency || "USD")}</span>
                            )}
                          </span>
                          <span className={styles.pcardBtn}>Purchase</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
