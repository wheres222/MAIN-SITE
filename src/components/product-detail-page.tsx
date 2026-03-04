"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { lineId, readCart, variantsFor, writeCart } from "@/lib/cart";
import type { SellAuthPaymentMethod, SellAuthProduct } from "@/types/sellauth";
import styles from "./product-detail-page.module.css";

interface ProductDetailPageProps {
  product: SellAuthProduct;
  paymentMethods: SellAuthPaymentMethod[];
}

interface RequirementItem {
  label: string;
  value: string;
}

interface FeatureTab {
  title: string;
  items: string[];
}

interface ParsedDetailContent {
  descriptionParagraphs: string[];
  requirements: RequirementItem[];
  featureTabs: FeatureTab[];
}

function money(value: number | null, code = "USD"): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

function cleanDescription(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r/g, "")
    .trim();
}

function parseGalleryImages(product: SellAuthProduct): string[] {
  const urls = new Set<string>();

  if (product.image?.trim()) {
    urls.add(product.image.trim());
  }

  const description = product.description || "";

  const markdownImageRegex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+\.(?:png|jpe?g|webp|gif))\)/gi;
  let markdownMatch: RegExpExecArray | null;
  while ((markdownMatch = markdownImageRegex.exec(description))) {
    const found = markdownMatch[1]?.trim();
    if (found) urls.add(found);
  }

  const plainImageRegex = /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif))/gi;
  let plainMatch: RegExpExecArray | null;
  while ((plainMatch = plainImageRegex.exec(description))) {
    const found = plainMatch[1]?.trim();
    if (found) urls.add(found);
  }

  return [...urls];
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseRequirementLine(line: string): RequirementItem | null {
  const match = line.match(/^([^:]{2,40})\s*:\s*(.+)$/);
  if (!match) return null;

  const rawLabel = match[1].trim();
  const value = match[2].trim();
  if (!rawLabel || !value) return null;

  const normalized = normalizeLabel(rawLabel);

  if (/(supported )?os|operating system|windows|linux|mac/.test(normalized)) {
    return { label: "Supported OS", value };
  }
  if (/(supported )?cpu|processor/.test(normalized)) {
    return { label: "Supported CPU", value };
  }
  if (/(supported )?gpu|graphics/.test(normalized)) {
    return { label: "Supported GPU", value };
  }
  if (/ram|memory/.test(normalized)) {
    return { label: "RAM", value };
  }
  if (/game/.test(normalized)) {
    return { label: "Game", value };
  }

  return { label: rawLabel, value };
}

function parseTabHeading(line: string): string | null {
  const headingMatches = [
    line.match(/^##+\s+(.+)$/),
    line.match(/^\[tab\]\s*(.+)$/i),
    line.match(/^tab\s*:\s*(.+)$/i),
    line.match(/^([a-z0-9][a-z0-9\s/+&-]{1,30})\s*:\s*$/i),
  ];

  for (const match of headingMatches) {
    if (match?.[1]) {
      const title = match[1].trim();
      if (title && !/^requirements?$/i.test(title) && !/^features?$/i.test(title)) {
        return title;
      }
    }
  }

  return null;
}

function uniqueByLabel(input: RequirementItem[]): RequirementItem[] {
  const map = new Map<string, RequirementItem>();
  for (const item of input) {
    const key = normalizeLabel(item.label);
    if (!key) continue;
    map.set(key, item);
  }
  return [...map.values()];
}

function parseDetailContent(product: SellAuthProduct): ParsedDetailContent {
  const descriptionText = cleanDescription(product.description || "");
  const lines = descriptionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const requirements: RequirementItem[] = [];
  const tabs: FeatureTab[] = [];
  const descriptionParagraphs: string[] = [];

  let currentTab: FeatureTab | null = null;
  let mode: "neutral" | "requirements" | "features" = "neutral";

  const ensureTab = (title: string) => {
    const existing = tabs.find((tab) => normalizeLabel(tab.title) === normalizeLabel(title));
    if (existing) {
      currentTab = existing;
      return existing;
    }

    const next: FeatureTab = { title: title.trim(), items: [] };
    tabs.push(next);
    currentTab = next;
    return next;
  };

  for (const line of lines) {
    if (/^requirements?$/i.test(line)) {
      mode = "requirements";
      currentTab = null;
      continue;
    }

    if (/^features?$/i.test(line)) {
      mode = "features";
      continue;
    }

    const tabTitle = parseTabHeading(line);
    if (tabTitle) {
      mode = "features";
      ensureTab(tabTitle);
      continue;
    }

    const requirement = parseRequirementLine(line);
    if (requirement && mode !== "features") {
      requirements.push(requirement);
      continue;
    }

    const bullet = line.match(/^(?:[-*•]\s+|\d+[.)]\s+)(.+)$/)?.[1]?.trim();
    if (bullet && currentTab) {
      (currentTab as FeatureTab).items.push(bullet);
      continue;
    }

    if (mode === "features" && currentTab) {
      const inlineItems = line
        .split(/[|,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (inlineItems.length > 1) {
        (currentTab as FeatureTab).items.push(...inlineItems);
        continue;
      }

      if (line.length <= 90) {
        (currentTab as FeatureTab).items.push(line);
        continue;
      }
    }

    descriptionParagraphs.push(line);
  }

  const parsedRequirements = uniqueByLabel(requirements);
  const featureTabs = tabs
    .map((tab) => ({ ...tab, items: [...new Set(tab.items)] }))
    .filter((tab) => tab.title && tab.items.length > 0);

  const fallbackRequirements: RequirementItem[] = [
    { label: "Supported OS", value: "Windows 10/11" },
    { label: "Supported CPU", value: "AMD / Intel" },
  ];

  const fallbackFeatureTabs: FeatureTab[] = [
    {
      title: "Aimbot",
      items: [
        "Field Of View",
        "Smoothness",
        "Bone Selection",
        "Max Distance",
        "FOV Circle",
        "Ignore Invisible",
        "Aim Line",
        "Aim Cross",
        "Perfect Prediction",
      ],
    },
    {
      title: "Player ESP",
      items: [
        "Player Name",
        "Distance",
        "Box",
        "Corner Box",
        "Skeleton",
        "Health Bars",
        "Shield Bars (Color Based)",
        "OOF Arrow",
        "Look Direction",
      ],
    },
    {
      title: "Radar",
      items: ["Show Players", "Aimline", "Distance"],
    },
    {
      title: "Misc",
      items: ["Extra utility options can be configured from SellAuth description tabs."],
    },
  ];

  return {
    descriptionParagraphs,
    requirements: parsedRequirements.length ? parsedRequirements : fallbackRequirements,
    featureTabs: featureTabs.length ? featureTabs : fallbackFeatureTabs,
  };
}

function featureIconSvg(title: string) {
  const value = normalizeLabel(title);

  if (value.includes("aim")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6.6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("esp") || value.includes("player")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8.1" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 16.2c.9-1.6 2.1-2.3 3.3-2.3 1.3 0 2.5.7 3.3 2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="15.9" cy="10.4" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13.2 16.4c.7-1.4 1.6-2 2.7-2 .9 0 1.8.4 2.6 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("radar")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 12 16.5 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="18" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function ProductDetailPage({ product, paymentMethods }: ProductDetailPageProps) {
  const variants = useMemo(() => variantsFor(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    variants[0]?.id || product.id
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [notice, setNotice] = useState("");

  const detailContent = useMemo(() => parseDetailContent(product), [product]);
  const galleryImages = useMemo(() => parseGalleryImages(product), [product]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  useEffect(() => {
    setOpenTabs(detailContent.featureTabs.slice(0, 3).map((tab) => tab.title));
  }, [detailContent.featureTabs, product.id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id]);

  const variantMinQuantity = variants.reduce<number>((max, variant) => {
    const value = typeof variant.minQuantity === "number" ? variant.minQuantity : 1;
    return value > max ? value : max;
  }, 1);

  const heuristicMinQuantity = /mail/i.test(
    `${product.name} ${product.groupName} ${product.categoryName} ${variants
      .map((variant) => variant.name)
      .join(" ")}`
  )
    ? 25
    : 1;

  const minQuantity = Math.max(
    1,
    product.minQuantity || 1,
    variantMinQuantity,
    heuristicMinQuantity
  );
  const [quantity, setQuantity] = useState(minQuantity);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) || variants[0] || null;

  const selectedUnitPrice =
    selectedVariant?.price ?? variants[0]?.price ?? product.price ?? 0;

  const paymentMethod = paymentMethods[0]?.id || "crypto";

  function resolveCheckoutQuantity() {
    const variantMinimum =
      typeof selectedVariant?.minQuantity === "number"
        ? Math.max(1, selectedVariant.minQuantity)
        : 1;
    const requiredMinimum = Math.max(minQuantity, variantMinimum);
    const checkoutQuantity = Math.max(requiredMinimum, quantity);

    if (checkoutQuantity !== quantity) {
      setQuantity(checkoutQuantity);
    }

    return checkoutQuantity;
  }

  function addToCart() {
    const checkoutQuantity = resolveCheckoutQuantity();
    const checkoutVariantId = selectedVariant?.isSynthetic ? undefined : selectedVariant?.id;
    const id = lineId(product.id, checkoutVariantId);
    const currentLines = readCart();
    const existingLine = currentLines.find((line) => line.lineId === id);

    if (existingLine) {
      writeCart(
        currentLines.map((line) =>
          line.lineId === id
            ? {
                ...line,
                quantity: line.quantity + checkoutQuantity,
                unitPrice: selectedUnitPrice,
              }
            : line
        )
      );
      setNotice("Quantity updated in cart. Cart is saved if you close the tab.");
      return;
    }

    writeCart([
      ...currentLines,
      {
        lineId: id,
        productId: product.id,
        productName: product.name,
        image: product.image,
        quantity: checkoutQuantity,
        variantId: checkoutVariantId,
        variantName: selectedVariant?.isSynthetic ? undefined : selectedVariant?.name,
        unitPrice: selectedUnitPrice,
        currency: product.currency || "USD",
        status: "undetected",
      },
    ]);

    setNotice("Added to cart. Cart is saved in your browser.");
  }

  async function checkoutNow() {
    setNotice("");
    const checkoutQuantity = resolveCheckoutQuantity();
    const checkoutVariantId = selectedVariant?.isSynthetic ? undefined : selectedVariant?.id;

    setIsCheckingOut(true);
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod,
            items: [
              {
                productId: product.id,
                quantity: checkoutQuantity,
                ...(checkoutVariantId ? { variantId: checkoutVariantId } : {}),
              },
            ],
          }),
        });

        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          redirectUrl?: string | null;
        };

        if (response.ok && payload.success) {
          if (payload.redirectUrl) {
            window.location.href = payload.redirectUrl;
            return;
          }
          setNotice(payload.message || "Checkout created.");
          return;
        }

        const message = payload.message || "Unable to create checkout.";
        const minMatch = message.match(/minimum quantity of\s*(\d+)/i);
        if (minMatch && attempt === 0) {
          const parsedMinimum = Number(minMatch[1]);
          if (Number.isFinite(parsedMinimum) && parsedMinimum > checkoutQuantity) {
            setQuantity(parsedMinimum);
            continue;
          }
        }

        setNotice(message);
        return;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  function toggleTab(title: string) {
    setOpenTabs((previous) =>
      previous.includes(title)
        ? previous.filter((item) => item !== title)
        : [...previous, title]
    );
  }

  return (
    <div className={styles.page}>
      <SiteHeader activeTab="store" />

      <main className={styles.shell}>
        <section className={styles.topGrid}>
          <div>
            <article className={styles.imagePanel}>
              <div className={styles.imageViewport}>
                <div
                  className={styles.imageTrack}
                  style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                >
                  {galleryImages.map((src, index) => (
                    <div key={`${src}-${index}`} className={styles.imageSlide}>
                      <img src={src} alt={`${product.name} preview ${index + 1}`} />
                    </div>
                  ))}
                </div>

                {galleryImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.imageNavBtn} ${styles.imageNavPrev}`}
                      onClick={() =>
                        setActiveImageIndex((value) =>
                          value <= 0 ? galleryImages.length - 1 : value - 1
                        )
                      }
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className={`${styles.imageNavBtn} ${styles.imageNavNext}`}
                      onClick={() =>
                        setActiveImageIndex((value) =>
                          value >= galleryImages.length - 1 ? 0 : value + 1
                        )
                      }
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>

              <div className={styles.thumbRow}>
                {galleryImages.map((src, index) => (
                  <button
                    key={`thumb-${src}-${index}`}
                    type="button"
                    className={`${styles.thumbBtn} ${
                      index === activeImageIndex ? styles.thumbBtnActive : ""
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Open image ${index + 1}`}
                  >
                    <img src={src} alt="" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </article>
          </div>

          <article className={styles.buyColumn}>
            <h1>{product.name}</h1>
            <p className={styles.price}>{money(selectedUnitPrice, product.currency)}</p>

            <h3 className={styles.optionLabel}>SELECT OPTION</h3>
            <div className={styles.optionsGrid}>
              {variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={isCheckingOut}
                  >
                    <span className={styles.optionName}>{variant.name}</span>
                    <span className={styles.optionPrice}>
                      {money(variant.price, product.currency)}
                    </span>
                    {isSelected ? <span className={styles.optionCheck}>✓</span> : null}
                  </button>
                );
              })}
            </div>

            <div className={styles.qtyStockRow}>
              <div className={styles.qtyStepper}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((value) => Math.max(minQuantity, value - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {minQuantity > 1 ? (
              <p className={styles.minimumHint}>Minimum quantity for this product: {minQuantity}</p>
            ) : null}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.buyNowBtn}
                onClick={checkoutNow}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? "Processing..." : "Buy Now"}
              </button>
              <button type="button" className={styles.addToCartBtn} onClick={addToCart}>
                Add to Cart
              </button>
            </div>

            {notice ? <p className={styles.notice}>{notice}</p> : null}
          </article>
        </section>

        <section className={styles.detailsStack}>
          {detailContent.descriptionParagraphs.length ? (
            <section className={styles.detailBlock}>
              <h2 className={styles.detailBlockTitle}>Description</h2>
              {detailContent.descriptionParagraphs.map((line, index) => (
                <p key={`${product.id}-description-${index}`} className={styles.descriptionText}>
                  {line}
                </p>
              ))}
            </section>
          ) : null}

          <section className={styles.detailBlock}>
            <h2 className={styles.detailBlockTitle}>Requirements</h2>
            <div className={styles.requirementsRow}>
              {detailContent.requirements.map((item) => (
                <article key={`${item.label}-${item.value}`} className={styles.requirementMini}>
                  <span className={styles.requirementMiniIcon} aria-hidden>
                    {item.label.toLowerCase().includes("cpu") ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9.8 3.8v2.4M14.2 3.8v2.4M9.8 17.8v2.4M14.2 17.8v2.4M3.8 9.8h2.4M17.8 9.8h2.4M3.8 14.2h2.4M17.8 14.2h2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4.8 5.4h14.4v13.2H4.8z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9.2 8.5v6.8M12 8.5v6.8M14.8 8.5v6.8" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </span>
                  <span className={styles.requirementMiniLabel}>{item.label}</span>
                  <strong className={styles.requirementMiniValue}>{item.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.detailBlock}>
            <h2 className={styles.detailBlockTitle}>Features</h2>
            <div className={styles.featuresGrid}>
              {detailContent.featureTabs.map((tab) => {
                const isOpen = openTabs.includes(tab.title);
                const maxHeight = Math.max(78, tab.items.length * 30 + 18);

                return (
                  <article key={tab.title} className={styles.featureTabCard}>
                    <button
                      type="button"
                      className={styles.featureTabHeader}
                      onClick={() => toggleTab(tab.title)}
                      aria-expanded={isOpen}
                    >
                      <span className={styles.featureTabHeaderLeft}>
                        <span className={styles.featureTabIcon}>{featureIconSvg(tab.title)}</span>
                        <strong>{tab.title}</strong>
                      </span>

                      <span
                        className={`${styles.featureTabChevron} ${
                          isOpen ? styles.featureTabChevronOpen : ""
                        }`}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className={`${styles.featureTabBody} ${isOpen ? styles.featureTabBodyOpen : ""}`}
                      style={{
                        ["--feature-max-height" as string]: `${maxHeight}px`,
                      }}
                    >
                      <ul className={styles.featureList}>
                        {tab.items.map((item) => (
                          <li key={`${tab.title}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
