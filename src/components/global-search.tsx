"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { productHref } from "@/lib/product-route";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchStorefrontClient();
        if (active) setStorefront(data);
      } catch {
        if (active) setStorefront(null);
      } finally {
        if (active) setIsLoading(false);
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

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!query.trim()) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      window.location.href = productHref(suggestions[activeIndex]);
    }
  }

  return (
    <div className="search-wrap">
      <span className="search-icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search games..."
        aria-label="Search games"
      />

      {query.trim() ? (
        <div id="global-search-list" className="search-suggestions" role="listbox" aria-label="Suggested products">
          {isLoading ? (
            <p className="search-suggestion-empty">Searching products...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((product, index) => {
              const price = money(productLowestPrice(product), product.currency || "USD");
              const inStock = (product.stock ?? 1) > 0;
              const isActive = index === activeIndex;

              return (
                <Link
                  key={product.id}
                  id={`search-option-${product.id}`}
                  href={productHref(product)}
                  className={`search-suggestion-item ${isActive ? "search-suggestion-item-active" : ""}`}
                  onClick={() => setQuery("")}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="search-suggestion-thumb" aria-hidden="true">
                    <Image
                      src={product.image || "/games/fortnite.svg"}
                      alt=""
                      width={160}
                      height={90}
                      sizes="72px"
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

      {query ? (
        <button
          type="button"
          className="search-clear-btn"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setActiveIndex(-1);
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
