"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";

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

function productLowestPrice(product: SellAuthProduct): number | null {
  const prices: number[] = [];
  if (typeof product.price === "number") prices.push(product.price);
  for (const variant of product.variants) {
    if (typeof variant.price === "number") prices.push(variant.price);
  }
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/storefront", { cache: "no-store" });
        const data = (await response.json()) as StorefrontData;
        if (active) setStorefront(data);
      } catch {
        if (active) setStorefront(null);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const keyword = normalized(query);
    if (!keyword || !storefront) return [];

    return storefront.products
      .filter((product) =>
        normalized(`${product.name} ${product.groupName} ${product.categoryName}`).includes(keyword)
      )
      .slice(0, 8);
  }, [query, storefront]);

  return (
    <div className="search-wrap">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search games..."
        aria-label="Search games"
      />

      {query.trim() ? (
        <div className="search-suggestions" role="listbox" aria-label="Suggested products">
          {suggestions.length > 0 ? (
            suggestions.map((product) => {
              const price = money(productLowestPrice(product), product.currency || "USD");
              const inStock = (product.stock ?? 1) > 0;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="search-suggestion-item"
                  onClick={() => setQuery("")}
                >
                  <span className="search-suggestion-thumb" aria-hidden="true">
                    <Image
                      src={product.image || "/games/fortnite.svg"}
                      alt=""
                      width={160}
                      height={90}
                      sizes="72px"
                      unoptimized
                    />
                  </span>
                  <span className="search-suggestion-copy">
                    <span className="search-suggestion-name">{product.name}</span>
                    <span className="search-suggestion-meta">
                      {product.groupName || product.categoryName || "Product"}
                    </span>
                  </span>
                  <span className="search-suggestion-right">
                    <span className="search-suggestion-price">{price}</span>
                    <span
                      className={`search-suggestion-stock ${
                        inStock ? "search-suggestion-stock-ok" : "search-suggestion-stock-low"
                      }`}
                    >
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="search-suggestion-empty">No matching products.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
