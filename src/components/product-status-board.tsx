"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SellAuthProduct } from "@/types/sellauth";
import styles from "@/components/product-status-board.module.css";

type StatusKind = "updating" | "undetected";

interface ProductStatusMeta {
  kind: StatusKind;
  label: string;
}

interface ProductStatusBoardProps {
  products: SellAuthProduct[];
}

function fallbackImageForProduct(product: SellAuthProduct): string {
  const source = `${product.groupName} ${product.categoryName} ${product.name}`.toLowerCase();
  if (source.includes("rust")) return "/pd/rust.png";
  if (source.includes("valorant") || source.includes("val")) return "/pd/valorant.png";
  if (source.includes("rainbow") || source.includes("r6")) return "/pd/rainbow-six-siege.png";
  if (source.includes("apex")) return "/pd/apex.png";
  if (source.includes("call of duty") || source.includes("cod")) return "/pd/call-of-duty.png";
  return "/games/fortnite.svg";
}

function inferStatus(product: SellAuthProduct): ProductStatusMeta {
  const stock = product.stock ?? 0;
  const seed = Math.abs(product.id + product.name.length + stock);

  if (stock <= 0 || seed % 7 === 0) {
    return { kind: "updating", label: "UPDATING (NOT WORKING)" };
  }
  return { kind: "undetected", label: "UNDETECTED (WORKING)" };
}

function normalized(value: string): string {
  return value.toLowerCase().trim();
}

function StatusBadgeIcon({ kind }: { kind: StatusKind }) {
  if (kind === "undetected") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4.1 18 6.7v5.4c0 4-2.6 6.3-6 7.5-3.4-1.2-6-3.5-6-7.5V6.7l6-2.6Z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M12 4.1 6 6.7v5.4c0 4 2.6 6.3 6 7.5V4.1Z"
          fill="currentColor"
          opacity="0.52"
        />
        <path
          d="M12 4.1 18 6.7v5.4c0 4-2.6 6.3-6 7.5-3.4-1.2-6-3.5-6-7.5V6.7l6-2.6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.2 6a4.1 4.1 0 0 0-4.5 5.5L5.2 16l2.8 2.8 4.6-4.5a4.1 4.1 0 0 0 5.4-4.5L15.6 12l-1.9-1.9L16 8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductStatusBoard({ products }: ProductStatusBoardProps) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const keyword = normalized(query);
    const groupedMap = new Map<string, SellAuthProduct[]>();

    for (const product of products) {
      const groupName = product.groupName || product.categoryName || "Other";
      const haystack = normalized(
        `${groupName} ${product.name} ${product.description} ${product.categoryName}`
      );
      if (keyword && !haystack.includes(keyword)) continue;

      const existing = groupedMap.get(groupName) || [];
      existing.push(product);
      groupedMap.set(groupName, existing);
    }

    return [...groupedMap.entries()]
      .map(([groupName, groupProducts]) => ({
        groupName,
        items: groupProducts.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [products, query]);

  const hasAnyProducts = grouped.some((group) => group.items.length > 0);

  return (
    <section className={styles.statusPage}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <h1>Status</h1>
          <label className={styles.searchWrap} aria-label="Search product status">
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
        </div>
      </header>

      {!hasAnyProducts && (
        <div className={styles.empty}>No products matched your search query.</div>
      )}

      {grouped.map((group) => (
        <section key={group.groupName} className={styles.group}>
          <h2 className={styles.groupTitle}>{group.groupName}</h2>
          <div className={styles.list}>
            {group.items.map((product) => {
              const status = inferStatus(product);
              const image = product.image || fallbackImageForProduct(product);

              return (
                <article key={product.id} className={styles.row}>
                  <div className={styles.rowLeft}>
                    <img
                      src={image}
                      alt={product.name}
                      className={styles.thumb}
                      loading="lazy"
                    />
                    <p className={styles.name}>{product.name}</p>
                  </div>
                  <p className={styles.supportedOn}>
                    <span>SUPPORTED ON:</span>
                    <strong>Windows 10 & 11</strong>
                  </p>
                  <span className={`${styles.badge} ${styles[status.kind]}`}>
                    <span className={styles.badgeIcon}>
                      <StatusBadgeIcon kind={status.kind} />
                    </span>
                    {status.label}
                  </span>
                  <Link href={`/products/${product.id}`} className={styles.purchaseBtn}>
                    Purchase Now
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
