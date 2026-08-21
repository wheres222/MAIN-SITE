"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubpageSkeleton } from "@/components/subpage-skeleton";
import { productHref } from "@/lib/product-route";
import { categoryHref } from "@/lib/category-href";
import { CATEGORY_IMAGES, CATEGORY_TILES } from "@/lib/category-images";
import { canonicalGroupSlug } from "@/lib/category-tiles";
import { fetchStorefrontClient, primeStorefrontCache } from "@/lib/storefront-client-cache";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";
import styles from "./products-catalog.module.css";
import { usePreferences } from "@/components/preferences-provider";

const PLACEHOLDER = "/placeholders/category-banner-not-added.svg";


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

export function ProductsCatalogClient({
  initialData,
  seoFooter,
}: {
  initialData?: StorefrontData | null;
  /**
   * Server-rendered editorial block, passed in rather than imported, so the
   * long-form copy stays out of this client bundle and lands in the initial
   * HTML. Same arrangement as GameCatalogPage's seoFooter.
   */
  seoFooter?: React.ReactNode;
} = {}) {
  // Prices are stored in USD and converted for display only — the charge is
  // always USD. The currency argument some call sites still pass came from
  // SellAuth and was always "USD"; the display currency is the visitor's
  // choice now, so it is ignored.
  const { money: formatPrice, t } = usePreferences();
  const money = (value: number | null, _currency?: string): string =>
    value === null ? "N/A" : formatPrice(value);

  // Seed from the server render so the catalog is present in the HTML — this
  // page previously shipped only a skeleton and filled in client-side, which
  // meant crawlers indexed an empty page.
  const [data, setData] = useState<StorefrontData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (initialData) primeStorefrontCache(initialData);

    let alive = true;
    fetchStorefrontClient()
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [initialData]);

  // Build per-game groups from the product list. Anything new in SellAuth
  // shows up here automatically, using its own artwork when we have no
  // curated local image for it.
  const allGroups = useMemo<Group[]>(() => {
    const remoteImages = new Map<string, string>();
    for (const source of [...(data?.groups ?? []), ...(data?.categories ?? [])]) {
      const slug = canonicalGroupSlug(source.name || "");
      const url = source.image?.url;
      if (slug && url && !remoteImages.has(slug)) remoteImages.set(slug, url);
    }

    const map = new Map<string, Group>();
    for (const p of data?.products ?? []) {
      const rawName = (p.groupName || p.categoryName || "Other").trim();
      const slug = canonicalGroupSlug(rawName) || "other";
      let g = map.get(slug);
      if (!g) {
        const image =
          CATEGORY_IMAGES[slug] || remoteImages.get(slug) || p.image || PLACEHOLDER;
        g = { slug, name: rawName, image, products: [] };
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
        {/* The page opened straight into a search box: no H1, and nothing
            telling a crawler or a first-time visitor what the list is. Google
            files a page like that under Soft 404 whatever else is on it. */}
        <header className={styles.pageHead}>
          <h1 className={styles.pageTitle}>All Game Cheats</h1>
          <p className={styles.pageSub}>
            Every product we stock, across <Link href="/categories">sixteen games</Link>{" "}
            — externals, internals, HWID spoofers and accounts. Each product page
            carries its own live detection status, requirements and setup notes.
            Search or filter below.
          </p>
        </header>

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
                              <span className={styles.pcardPrice}>{t("product.from")} {money(price, product.currency || "USD")}</span>
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

        {seoFooter}
      </main>

      <SiteFooter />
    </div>
  );
}
