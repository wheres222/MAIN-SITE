"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDiscordUrl } from "@/lib/links";
import { variantsFor } from "@/lib/cart";
import type { SellAuthPaymentMethod, SellAuthProduct } from "@/types/sellauth";
import styles from "./product-detail-page.module.css";

interface ProductDetailPageProps {
  product: SellAuthProduct;
  paymentMethods: SellAuthPaymentMethod[];
}

function money(value: number | null, code = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProductDetailPage({ product, paymentMethods }: ProductDetailPageProps) {
  const variants = useMemo(() => variantsFor(product), [product]);
  const [activeTab, setActiveTab] = useState<"preview" | "video">("preview");
  const [buyingVariantId, setBuyingVariantId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const showcaseRef = useRef<HTMLElement | null>(null);

  const unitPrice = variants[0]?.price ?? product.price ?? 0;
  const paymentMethod = paymentMethods[0]?.id || "crypto";

  async function onBuyVariant(variantId: number) {
    setNotice("");
    setBuyingVariantId(variantId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: [
            {
              productId: product.id,
              quantity: 1,
              variantId,
            },
          ],
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        redirectUrl?: string | null;
      };

      if (!response.ok || !payload.success) {
        setNotice(payload.message || "Unable to create checkout.");
        return;
      }

      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return;
      }
      setNotice(payload.message || "Checkout created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setBuyingVariantId(null);
    }
  }

  function toShowcase() {
    showcaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const gameLabel = product.groupName || product.categoryName || "Rust";
  const discordUrl = getDiscordUrl();
  const featureGroups = [
    {
      title: "Combat",
      items: [
        "FOV",
        "Smoothing",
        "Recoil",
        "Spread",
        "Sway",
        "Hitboxes",
        "Silent Aim",
        "Trigger Assist",
        "Always Shoot",
        "No Recoil Pattern",
      ],
    },
    {
      title: "Visual",
      items: [
        "Box",
        "Name",
        "Distance",
        "Weapon",
        "Team ID",
        "Skeleton",
        "Chams",
        "Bright Night",
        "Third Person",
        "Radar Markers",
      ],
    },
    {
      title: "Entities",
      items: [
        "Animals",
        "Loot Crates",
        "Dropped Items",
        "Vehicles",
        "Construction",
        "Corpse Markers",
        "Tool Cupboards",
      ],
    },
    {
      title: "Misc",
      items: [
        "Instant Loot",
        "Fast Revive",
        "Instant Pickup",
        "Movement Assist",
        "No Fall",
        "Debug Camera",
        "Speed Config",
      ],
    },
  ];

  return (
    <div className={styles.page}>
      <SiteHeader
        activeTab="store"
        searchSlot={
          <div className="search-wrap">
            <input placeholder="Search..." aria-label="Search products" />
          </div>
        }
      />

      <main className={styles.shell}>
        <div className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>&gt;</span>
          <Link href="/">Products</Link>
          <span>&gt;</span>
          <strong>{product.name}</strong>
        </div>

        <section className={styles.topGrid}>
          <div>
            <article className={styles.imagePanel}>
              <span className={styles.deliveryBadge}>Instant Delivery</span>
              <div className={styles.imageWrap}>
                <img src={product.image} alt={product.name} />
              </div>
            </article>

            <div className={styles.supportPills}>
              <article>
                <span className={styles.supportIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3.2 5.4 5.8v5.3c0 4.3 2.7 7.7 6.6 9.7 3.9-2 6.6-5.4 6.6-9.7V5.8L12 3.2Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path d="m9.3 12.2 1.8 1.9 3.6-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <strong>In stock</strong>
                <span>Available</span>
              </article>
              <article>
                <span className={styles.supportIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13.2 2.8 5.9 13h4.9L9.9 21.2 18.1 10h-5l.1-7.2Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <strong>Instant</strong>
                <span>Delivery</span>
              </article>
              <article>
                <span className={styles.supportIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="6.3" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                    <path
                      d="M7.9 20.2v-3.9c0-1.7 1.4-3.1 3.1-3.1h2c1.7 0 3.1 1.4 3.1 3.1v3.9M12 13.2v7"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <strong>24/7</strong>
                <span>Support</span>
              </article>
            </div>
          </div>

          <article className={styles.buyColumn}>
            <p className={styles.stock}>
              <span className={styles.stockDot} aria-hidden />
              In stock
            </p>
            <h1>{product.name}</h1>
            <p className={styles.price}>{money(unitPrice, product.currency)}</p>

            <h3 className={styles.optionLabel}>SELECT OPTION</h3>
            <div className={styles.optionsGrid}>
              {variants.map((variant) => {
                return (
                  <button
                    key={variant.id}
                    className={styles.optionCard}
                    onClick={() => onBuyVariant(variant.id)}
                    disabled={buyingVariantId !== null}
                  >
                    <strong className={styles.optionLine}>
                      {buyingVariantId === variant.id
                        ? "Processing..."
                        : `${variant.name} - ${money(variant.price, product.currency)}`}
                    </strong>
                  </button>
                );
              })}
            </div>

            {notice ? <p className={styles.notice}>{notice}</p> : null}
          </article>
        </section>

        <button className={styles.scrollHint} onClick={toShowcase}>
          Scroll down to view features and showcase
        </button>

        <section className={styles.requirements}>
          <h2>System Requirements</h2>
          <div className={styles.requirementGrid}>
            <article>
              <span className={`${styles.requirementIcon} ${styles.requirementIconGear}`} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.9 3.7h2.2l.3 2.1c.6.2 1.1.4 1.6.7l1.8-1.1 1.6 1.6-1.1 1.8c.3.5.5 1 .7 1.6l2.1.3v2.2l-2.1.3c-.2.6-.4 1.1-.7 1.6l1.1 1.8-1.6 1.6-1.8-1.1c-.5.3-1 .5-1.6.7l-.3 2.1h-2.2l-.3-2.1c-.6-.2-1.1-.4-1.6-.7l-1.8 1.1-1.6-1.6 1.1-1.8a6.8 6.8 0 0 1-.7-1.6L3.7 13v-2.2l2.1-.3c.2-.6.4-1.1.7-1.6L5.4 7.1l1.6-1.6 1.8 1.1c.5-.3 1-.5 1.6-.7l.5-2.2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <h4>Operating System</h4>
              <p>Windows 10 & 11 NO CUSTOM OS</p>
            </article>
            <article>
              <span className={`${styles.requirementIcon} ${styles.requirementIconGear}`} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.9 3.7h2.2l.3 2.1c.6.2 1.1.4 1.6.7l1.8-1.1 1.6 1.6-1.1 1.8c.3.5.5 1 .7 1.6l2.1.3v2.2l-2.1.3c-.2.6-.4 1.1-.7 1.6l1.1 1.8-1.6 1.6-1.8-1.1c-.5.3-1 .5-1.6.7l-.3 2.1h-2.2l-.3-2.1c-.6-.2-1.1-.4-1.6-.7l-1.8 1.1-1.6-1.6 1.1-1.8a6.8 6.8 0 0 1-.7-1.6L3.7 13v-2.2l2.1-.3c.2-.6.4-1.1.7-1.6L5.4 7.1l1.6-1.6 1.8 1.1c.5-.3 1-.5 1.6-.7l.5-2.2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <h4>Processors</h4>
              <p>Intel & AMD</p>
            </article>
            <article>
              <span className={`${styles.requirementIcon} ${styles.requirementIconGear}`} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.9 3.7h2.2l.3 2.1c.6.2 1.1.4 1.6.7l1.8-1.1 1.6 1.6-1.1 1.8c.3.5.5 1 .7 1.6l2.1.3v2.2l-2.1.3c-.2.6-.4 1.1-.7 1.6l1.1 1.8-1.6 1.6-1.8-1.1c-.5.3-1 .5-1.6.7l-.3 2.1h-2.2l-.3-2.1c-.6-.2-1.1-.4-1.6-.7l-1.8 1.1-1.6-1.6 1.1-1.8a6.8 6.8 0 0 1-.7-1.6L3.7 13v-2.2l2.1-.3c.2-.6.4-1.1.7-1.6L5.4 7.1l1.6-1.6 1.8 1.1c.5-.3 1-.5 1.6-.7l.5-2.2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <h4>Inbuilt Spoofer</h4>
              <p>No</p>
            </article>
            <article>
              <span className={`${styles.requirementIcon} ${styles.requirementIconGamepad}`} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7.2 8.4h9.6c2.5 0 4.3 2.4 3.6 4.8l-1 3.2c-.5 1.7-2.5 2.4-3.9 1.3l-1.7-1.4a2.8 2.8 0 0 0-3.6 0l-1.7 1.4c-1.4 1.1-3.4.4-3.9-1.3l-1-3.2c-.7-2.4 1.1-4.8 3.6-4.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M8.8 12.4v2.4M7.6 13.6H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="15.7" cy="12.8" r="1" fill="currentColor" />
                  <circle cx="17.4" cy="14.4" r="1" fill="currentColor" />
                </svg>
              </span>
              <h4>Game</h4>
              <p>{gameLabel}</p>
            </article>
          </div>
        </section>

        <section className={styles.showcase} ref={showcaseRef}>
          <div className={styles.showcaseHeading}>
            <h2>Product Showcase</h2>
            <button onClick={() => setActiveTab("video")}>Watch Showcase</button>
          </div>

          <div className={styles.showcaseCard}>
            <div className={styles.showcaseTabs}>
              <button
                className={activeTab === "preview" ? styles.tabActive : ""}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
              <button
                className={activeTab === "video" ? styles.tabActive : ""}
                onClick={() => setActiveTab("video")}
              >
                Showcase Video
              </button>
            </div>

            {activeTab === "preview" ? (
              <div className={styles.previewPane}>
                <img src="/showcase/menu-preview.svg" alt="Showcase preview" />
              </div>
            ) : (
              <div className={styles.videoPane}>
                <p>Video preview tab is active.</p>
                <a href={discordUrl} target="_blank" rel="noreferrer">
                  Open Showcase Link
                </a>
              </div>
            )}
          </div>
        </section>

        <section className={styles.features}>
          <h2>Features</h2>
          <div className={styles.featureGrid}>
            {featureGroups.map((group) => (
              <article key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

