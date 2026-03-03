"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SellAuthProduct } from "@/types/sellauth";
import styles from "@/components/product-status-board.module.css";

type PrimaryStatus = "safe" | "updating";
type FreshnessStatus = "upToDate" | "needsUpdate";

interface ProductStatusMeta {
  primary: PrimaryStatus;
  primaryLabel: string;
  freshness: FreshnessStatus;
  freshnessLabel: string;
}

interface ProductStatusBoardProps {
  products: SellAuthProduct[];
}

function inferStatus(product: SellAuthProduct): ProductStatusMeta {
  if (typeof product.stock === "number" && product.stock <= 0) {
    return {
      primary: "updating",
      primaryLabel: "Updating",
      freshness: "needsUpdate",
      freshnessLabel: "Needs Update",
    };
  }

  return {
    primary: "safe",
    primaryLabel: "Safe",
    freshness: "upToDate",
    freshnessLabel: "Up To Date",
  };
}

function normalized(value: string): string {
  return value.toLowerCase().trim();
}

function categoryLogoForName(groupName: string): string {
  const source = normalized(groupName);

  if (source.includes("apex")) return "/pd/apex.png";
  if (source.includes("valorant") || source.includes("val")) return "/pd/valorant.png";
  if (source.includes("rust")) return "/pd/rust.png";
  if (source.includes("rainbow") || source.includes("r6")) return "/pd/rainbow-six-siege.png";
  if (source.includes("call of duty") || source.includes("cod")) return "/pd/call-of-duty.png";
  if (source.includes("fortnite")) return "/pd/fortnite.png";
  if (source.includes("counter") || source.includes("cs2")) return "/pd/counter-strike-2.png";
  if (source.includes("dayz")) return "/pd/dayz.png";
  if (source.includes("fivem")) return "/pd/fivem.png";
  if (source.includes("roblox")) return "/pd/roblox.png";
  if (source.includes("pubg")) return "/pd/pubg.png";
  if (source.includes("league") || source.includes("lol")) return "/pd/lol.png";
  if (source.includes("hwid")) return "/pd/hwid-spoofers.png";

  return "/pd/misc.svg";
}

interface GroupedCategory {
  name: string;
  logo: string;
  items: SellAuthProduct[];
}

export function ProductStatusBoard({ products }: ProductStatusBoardProps) {
  const [query, setQuery] = useState("");

  const grouped = useMemo<GroupedCategory[]>(() => {
    const keyword = normalized(query);
    const groupedMap = new Map<string, SellAuthProduct[]>();

    for (const product of products) {
      const categoryName = product.groupName || product.categoryName || "Other";

      const haystack = normalized(
        `${categoryName} ${product.categoryName} ${product.name} ${product.description}`
      );

      if (keyword && !haystack.includes(keyword)) continue;

      const existing = groupedMap.get(categoryName) || [];
      existing.push(product);
      groupedMap.set(categoryName, existing);
    }

    return [...groupedMap.entries()]
      .map(([name, items]) => ({
        name,
        logo: categoryLogoForName(name),
        items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  return (
    <section className={styles.statusPage}>
      <header className={styles.hero}>
        <h1>Status</h1>
        <p>Real-time status. Perfectly simple.</p>
      </header>

      <label className={styles.searchWrap} aria-label="Search status list">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
        />
      </label>

      {!grouped.length && <div className={styles.empty}>No products matched your search query.</div>}

      {grouped.length ? (
        <div className={styles.categoryGrid}>
          {grouped.map((category) => (
            <section key={category.name} className={styles.categoryCard}>
              <header className={styles.categoryHeader}>
                <span className={styles.categoryLogoBox} aria-hidden="true">
                  <img src={category.logo} alt="" className={styles.categoryLogo} loading="lazy" />
                </span>

                <h2 className={styles.categoryTitle}>{category.name}</h2>

                <span className={styles.countChip}>
                  {category.items.length} {category.items.length === 1 ? "product" : "products"}
                </span>
              </header>

              <ul className={styles.productList}>
                {category.items.map((product) => {
                  const status = inferStatus(product);

                  return (
                    <li key={product.id} className={styles.productRow}>
                      <p className={styles.name}>
                        <Link href={`/products?id=${product.id}`}>{product.name}</Link>
                      </p>

                      <div className={styles.rowBadges}>
                        <span
                          className={`${styles.inlineBadge} ${
                            status.primary === "safe" ? styles.pillSafe : styles.pillUpdating
                          }`}
                        >
                          {status.primaryLabel}
                        </span>

                        <span
                          className={`${styles.inlineBadge} ${
                            status.freshness === "upToDate"
                              ? styles.pillUpToDate
                              : styles.pillNeedsUpdate
                          }`}
                        >
                          {status.freshnessLabel}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
