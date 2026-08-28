"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { categoryHref } from "@/lib/category-href";
import { productDisplayName, productHref } from "@/lib/product-route";
import { ProductSeoSections } from "@/components/product-seo-sections";
import type { ProductSeoContent } from "@/lib/product-seo-content";
import { variantsFor } from "@/lib/cart";
import { useCart } from "@/components/cart-provider";
import type { SellAuthPaymentMethod, SellAuthProduct, SellAuthVariant } from "@/types/sellauth";
import styles from "./product-detail-page.module.css";
import { usePreferences } from "@/components/preferences-provider";

interface ProductDetailPageProps {
  product: SellAuthProduct;
  paymentMethods: SellAuthPaymentMethod[];
  /** Editorial content for this product, when one has been written. */
  seoContent?: ProductSeoContent | null;
  /** Other products for the same game, for sideways navigation. */
  relatedProducts?: SellAuthProduct[];
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

interface ProductVideoPreview {
  url: string;
  title: string;
  description: string;
  poster?: string;
}

// Add product-specific videos here by SellAuth product ID:
// const PRODUCT_VIDEO_PREVIEW_BY_ID: Record<number, ProductVideoPreview> = {
//   638033: {
//     url: "https://www.youtube.com/watch?v=XXXX",
//     title: "Product Preview",
//     description: "Live gameplay showcase.",
//   },
// };
const PRODUCT_VIDEO_PREVIEW_BY_ID: Record<number, ProductVideoPreview> = {};

/**
 * Splits a formatted price so the cents can be dimmed against the whole
 * amount: "$239.99" -> ["$239", ".99", ""].
 *
 * formatMoney() always emits exactly two fraction digits, so the last
 * "<separator><2 digits>" group is the cents whatever the locale's separator
 * or symbol placement — "239,99 €" gives ["239", ",99", " €"], keeping the
 * trailing symbol at full brightness rather than dimming it with the decimals.
 */
function splitMoney(text: string): [string, string, string] {
  const match = text.match(/^(.*)([.,]\d{2})(\D*)$/);
  return match ? [match[1], match[2], match[3]] : [text, "", ""];
}

// Add group-wide videos here by slugified group/category name (e.g. "rust", "valorant"):
const PRODUCT_VIDEO_PREVIEW_BY_GROUP: Record<string, ProductVideoPreview> = {};


function cleanDescription(value: string): string {
  return value
    // SellAuth descriptions are rich text. Only <br> and </p> used to become
    // line breaks, so a <ul> collapsed into one run-on line and every heading
    // fused onto the paragraph after it — which made the parser below treat
    // whole descriptions as a single unparseable blob.
    .replace(/<\s*(?:br|hr)\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "\n• ")
    .replace(/<\/\s*(?:p|div|li|ul|ol|h[1-6]|tr|section|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    // Entities survive tag stripping, so without this a description reads
    // "Fast &amp; undetected".
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isDisplayImageUrl(value: string): boolean {
  const source = value.trim();
  if (!source) return false;

  const normalized = source.toLowerCase();

  // Filter known non-image SellAuth/variant key endpoints that create empty thumbnail boxes.
  if (
    normalized.includes("/desync/api/seller/keys/") ||
    normalized.includes("/seller/keys/") ||
    normalized.includes("promos.discord.gg")
  ) {
    return false;
  }

  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i.test(normalized)) {
    return true;
  }

  // Allow known image storage paths even when extension may be omitted.
  if (normalized.includes("/storage/images/") || normalized.includes("/uploads/")) {
    return true;
  }

  // Allow local static assets.
  if (normalized.startsWith("/")) {
    return true;
  }

  return false;
}

function parseGalleryImages(product: SellAuthProduct): string[] {
  const sellAuthImages = [...new Set((product.images || []).map((image) => image.trim()).filter(Boolean))]
    .filter(isDisplayImageUrl);

  if (sellAuthImages.length > 0) {
    return sellAuthImages;
  }

  const fallbackImage = product.image?.trim() || "";
  if (fallbackImage && isDisplayImageUrl(fallbackImage)) {
    return [fallbackImage];
  }

  return ["/placeholders/product-image-not-added.svg"];
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isAccountsOrVpnProduct(product: SellAuthProduct): boolean {
  const haystack = [
    product.groupName || "",
    product.categoryName || "",
    product.name || "",
  ]
    .map((value) => slugify(value))
    .join(" ");

  return /\baccount(s)?\b|\bvpn(s)?\b/.test(haystack);
}

function videoEmbedUrl(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v") || "";
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }
    }

    if (parsed.hostname.includes("odysee.com")) {
      // Convert https://odysee.com/claim-name:id → https://odysee.com/$/embed/claim-name:id
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0 && pathParts[0] !== "$") {
        return `https://odysee.com/$/embed/${pathParts[0]}`;
      }
      if (pathParts[0] === "$" && pathParts[1] === "embed" && pathParts[2]) {
        return `https://odysee.com/$/embed/${pathParts[2]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resolveProductVideoPreview(product: SellAuthProduct): ProductVideoPreview | null {
  const byId = PRODUCT_VIDEO_PREVIEW_BY_ID[product.id];
  if (byId?.url) return byId;

  const groupKey = slugify(product.groupName || product.categoryName || "");
  if (groupKey && PRODUCT_VIDEO_PREVIEW_BY_GROUP[groupKey]?.url) {
    return PRODUCT_VIDEO_PREVIEW_BY_GROUP[groupKey];
  }

  return null;
}

function isPostPaymentOnlyCopy(value: string): boolean {
  const normalized = normalizeLabel(value);
  return /(\bloader\b|\binstructions?\b|\bsetup\b|\bguide\b|\binstall\b|\blaunch\b|\binject\b)/.test(
    normalized
  );
}

/**
 * Delivery copy that genuinely only makes sense after payment.
 *
 * Deliberately much narrower than isPostPaymentOnlyCopy, which word-matches on
 * loader/install/setup/guide/launch/inject. That is fine for a short tab title,
 * but as a filter on prose it is catastrophic: "easy to install", "undetected
 * loader" and "launch the game" are ordinary sentences in a cheat listing, so
 * it silently deleted most of what sellers had written.
 */
function isDeliveryInstruction(line: string): boolean {
  const normalized = normalizeLabel(line);

  // A download link for the loader — the one thing worth withholding.
  if (/https?:\/\//i.test(line) && /(loader|download|install|setup|mirror)/.test(normalized)) {
    return true;
  }

  // A bare instruction heading with no content of its own.
  return /^(how to (install|set ?up|use)|installation|setup instructions?|instructions)\b[:\s]*$/i.test(
    line.trim()
  );
}

function parseRequirementLine(line: string): RequirementItem | null {
  const match = line.match(/^([^:]{2,40})\s*:\s*(.+)$/);
  if (!match) return null;

  const rawLabel = match[1].trim();
  const value = match[2].trim();
  if (!rawLabel || !value) return null;
  if (isPostPaymentOnlyCopy(`${rawLabel} ${value}`)) return null;

  const normalized = normalizeLabel(rawLabel);

  if (isPostPaymentOnlyCopy(`${rawLabel} ${value}`) || /(setup|guide|install|launch|inject)/.test(normalized)) {
    return null;
  }

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
      if (
        title &&
        !/^requirements?$/i.test(title) &&
        !/^features?$/i.test(title) &&
        !/^descriptions?$/i.test(title)
      ) {
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

    if (!isDeliveryInstruction(line)) {
      descriptionParagraphs.push(line);
    }
  }

  const featureTabs = tabs
    .map((tab) => ({
      ...tab,
      items: [...new Set(tab.items)].filter((item) => !isPostPaymentOnlyCopy(item)),
    }))
    .filter(
      (tab) => tab.title && tab.items.length > 0 && !isPostPaymentOnlyCopy(tab.title)
    );

  const tabsFromProduct = (product.tabs || [])
    .map((tab) => ({
      title: tab.title?.trim() || "",
      items: [...new Set((tab.items || []).map((item) => item.trim()).filter(Boolean))].filter(
        (item) => !isPostPaymentOnlyCopy(item)
      ),
    }))
    .filter(
      (tab) =>
        tab.title &&
        tab.items.length > 0 &&
        !isPostPaymentOnlyCopy(tab.title) &&
        !/^descriptions?$/i.test(tab.title) &&
        !/(requirements?|system|supported\s+os|supported\s+cpu|motherboard|bios)/i.test(tab.title)
    );

  const requirementsFromProductTabs: RequirementItem[] = [];

  for (const tab of tabsFromProduct) {
    const titleNorm = normalizeLabel(tab.title);
    const looksLikeRequirementTab =
      /requirement|system|compat|support/.test(titleNorm);

    if (!looksLikeRequirementTab || isPostPaymentOnlyCopy(tab.title)) continue;

    for (const item of tab.items) {
      const parsed = parseRequirementLine(item);
      if (parsed) {
        requirementsFromProductTabs.push(parsed);
        continue;
      }

      const trimmed = item.trim();
      if (!trimmed || isPostPaymentOnlyCopy(trimmed)) continue;

      if (/(supported )?os|operating system|windows|linux|mac/.test(titleNorm)) {
        requirementsFromProductTabs.push({ label: "Supported OS", value: trimmed });
        continue;
      }

      if (/(supported )?cpu|processor/.test(titleNorm)) {
        requirementsFromProductTabs.push({ label: "Supported CPU", value: trimmed });
        continue;
      }

      if (/(supported )?gpu|graphics/.test(titleNorm)) {
        requirementsFromProductTabs.push({ label: "Supported GPU", value: trimmed });
        continue;
      }

      if (/ram|memory/.test(titleNorm)) {
        requirementsFromProductTabs.push({ label: "RAM", value: trimmed });
        continue;
      }

      if (/^requirements?$/.test(titleNorm) || /system/.test(titleNorm)) {
        requirementsFromProductTabs.push({ label: "Requirement", value: trimmed });
        continue;
      }

      requirementsFromProductTabs.push({ label: tab.title, value: trimmed });
    }
  }

  const parsedRequirements = uniqueByLabel([
    ...requirements,
    ...requirementsFromProductTabs,
  ]).filter(
    (item) =>
      !isPostPaymentOnlyCopy(`${item.label} ${item.value}`) &&
      normalizeLabel(item.label) !== "requirement"
  );

  const mergedTabsByTitle = new Map<string, FeatureTab>();

  for (const tab of tabsFromProduct) {
    mergedTabsByTitle.set(normalizeLabel(tab.title), tab);
  }

  for (const tab of featureTabs) {
    const key = normalizeLabel(tab.title);
    if (!mergedTabsByTitle.has(key)) {
      mergedTabsByTitle.set(key, tab);
      continue;
    }

    const existing = mergedTabsByTitle.get(key) as FeatureTab;
    existing.items = [...new Set([...existing.items, ...tab.items])];
  }

  const resolvedFeatureTabs = [...mergedTabsByTitle.values()];

  const detectedOs = parsedRequirements.find((item) =>
    /(supported )?os|operating system|windows|linux|mac/.test(normalizeLabel(item.label))
  );
  const detectedCpu = parsedRequirements.find((item) =>
    /(supported )?cpu|processor/.test(normalizeLabel(item.label))
  );

  const resolvedRequirements: RequirementItem[] = [];

  if (detectedOs) {
    resolvedRequirements.push({ label: "Supported OS", value: detectedOs.value });
  }

  if (detectedCpu) {
    resolvedRequirements.push({ label: "Supported CPU", value: detectedCpu.value });
  }

  for (const item of parsedRequirements) {
    const key = normalizeLabel(item.label);
    if (key === "supported os" || key === "supported cpu") continue;
    if (resolvedRequirements.some((existing) => normalizeLabel(existing.label) === key)) continue;
    resolvedRequirements.push(item);
  }

  return {
    descriptionParagraphs,
    requirements: resolvedRequirements,
    featureTabs: resolvedFeatureTabs,
  };
}

const TAB_DESCRIPTIONS: Record<string, string> = {
  aimbot:          "Adjustable targeting with hitbox control.",
  triggerbot:      "Automatic firing with hitbox selection.",
  esp:             "Customizable player awareness visuals.",
  "player esp":    "Player box, skeleton and distance visuals.",
  "entity esp":    "Entity detection and tracking visuals.",
  radar:           "Real-time map awareness and player tracking.",
  loot:            "Item and loot detection with distance readout.",
  misc:            "Configuration management and overlay controls.",
  movement:        "Enhanced movement and mobility options.",
  vehicle:         "Vehicle detection and proximity awareness.",
  "world esp":     "World object and item visibility.",
  config:          "Profile saving and configuration management.",
  settings:        "Adjustable feature settings and presets.",
  npc:             "NPC detection and awareness options.",
  weapon:          "Weapon and item detection visuals.",
  "player exploit":"Advanced player interaction exploits.",
  resource:        "Resource and material detection.",
  food:            "Food and consumable item detection.",
  trap:            "Trap and hazard proximity detection.",
  item:            "Item and drop detection with distance.",
  visual:          "Visual enhancement and overlay options.",
  "aim assist":    "Smooth aim assistance with adjustable strength.",
  "no recoil":     "Recoil control and weapon stability.",
};

function tabDescription(title: string): string {
  return TAB_DESCRIPTIONS[title.toLowerCase().trim()] ?? "";
}


export function ProductDetailPage({ product, paymentMethods, seoContent, relatedProducts = [] }: ProductDetailPageProps) {
  // Prices are stored in USD and converted for display only — the charge is
  // always USD. The currency argument some call sites still pass came from
  // SellAuth and was always "USD"; the display currency is the visitor's
  // choice now, so it is ignored.
  const { money: formatPrice, t } = usePreferences();
  const { add: addToCart, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const money = (value: number | null, _currency?: string): string =>
    value === null ? "N/A" : formatPrice(value);

  const variants = useMemo(() => variantsFor(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    variants[0]?.id || product.id
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [notice, setNotice] = useState("");

  // No intermediate modal — Buy Now POSTs straight to /api/checkout and
  // window.location is set to the returned Stripe URL.

  const detailContent = useMemo(() => parseDetailContent(product), [product]);
  const galleryImages = useMemo(() => parseGalleryImages(product), [product]);
  const videoPreview = useMemo(() => resolveProductVideoPreview(product), [product]);
  const videoPreviewEmbed = useMemo(
    () => (videoPreview ? videoEmbedUrl(videoPreview.url) : null),
    [videoPreview]
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const showRequirements = !isAccountsOrVpnProduct(product);

  const cheatType = (() => {
    if (!showRequirements) return null;
    const text = `${product.name} ${product.description} ${product.variants.map((v) => v.name).join(" ")}`.toLowerCase();
    if (/\bexternal\b/.test(text)) return "External";
    if (/\binternal\b/.test(text)) return "Internal";
    return null;
  })();

  const displayRequirements = showRequirements
    ? [
        { label: "Supported CPU", value: "Intel + AMD" },
        { label: "Supported Windows Version", value: "10 - 11" },
        ...(cheatType ? [{ label: "Cheat Type", value: cheatType }] : []),
      ]
    : [];



  useEffect(() => {
    setLightboxOpen(false);
  }, [product.id]);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % galleryImages.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, galleryImages.length]);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

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

  // Click a variant → POST straight to /api/checkout (Stripe path) → redirect
  // to Stripe's hosted checkout. Stripe collects email there so no popup needed.
  async function checkoutNow(variantOverride?: SellAuthVariant) {
    setNotice("");
    setIsCheckingOut(true);

    const useVariant = variantOverride || selectedVariant;
    const checkoutQuantity  = resolveCheckoutQuantity();
    const checkoutVariantId = useVariant?.isSynthetic ? undefined : useVariant?.id;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const idempotencyKey = [
          "stripe",
          String(product.id),
          String(checkoutVariantId || 0),
          String(checkoutQuantity),
          Date.now().toString(),
        ].join("|");

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({
            paymentMethod: "stripe",
            currency:      "stripe",
            items: [
              {
                productId: product.id,
                quantity:  checkoutQuantity,
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


  return (
    <div className={styles.page}>
      <SiteHeader activeTab="store" />

      <main className={styles.shell}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Store", href: "/#games" },
            { label: product.groupName || product.categoryName || "Products", href: product.groupName ? categoryHref(product.groupName) : "/categories" },
            { label: product.name },
          ]}
        />
        <div className={styles.showreel}>
        <section className={styles.topGrid}>
          <div>
            <article className={styles.imagePanel}>
              {/* ── Main display: video or first image ── */}
              <div
                className={`${styles.mainDisplay} ${
                  videoPreview ? styles.mainDisplayVideo : ""
                }`}
              >
                {videoPreview && videoPreviewEmbed ? (
                  <iframe
                    src={videoPreviewEmbed}
                    title={`${product.name} video preview`}
                    className={styles.mainEmbed}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoPreview && !videoPreviewEmbed ? (
                  <video
                    className={styles.mainEmbed}
                    controls
                    preload="metadata"
                    playsInline
                    poster={videoPreview.poster || product.image}
                  >
                    <source src={videoPreview.url} />
                  </video>
                ) : galleryImages.length > 0 ? (
                  <button
                    type="button"
                    className={styles.mainImgBtn}
                    onClick={() => openLightbox(0)}
                    aria-label="View full size"
                  >
                    <img
                      src={galleryImages[0]}
                      alt={`${product.name} preview`}
                      loading="eager"
                      decoding="async"
                      className={styles.mainImg}
                    />
                  </button>
                ) : null}
              </div>

              {/* ── Thumbnail row: all extra images; click opens full-scale lightbox ── */}
              {(() => {
                // When a video occupies the main display, every image is a thumb.
                // Otherwise the first image is the main display, so thumbs are the rest.
                const thumbs = videoPreview ? galleryImages : galleryImages.slice(1);
                if (thumbs.length === 0) return null;
                return (
                  <div className={styles.thumbGrid}>
                    {thumbs.map((src, i) => {
                      const actualIndex = videoPreview ? i : i + 1;
                      return (
                        <button
                          key={`thumb-${src}-${i}`}
                          type="button"
                          className={styles.thumbCard}
                          onClick={() => openLightbox(actualIndex)}
                          aria-label={`View image ${actualIndex + 1} full size`}
                        >
                          <img src={src} alt={`${product.name} screenshot ${actualIndex + 1}`} loading="lazy" decoding="async" />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </article>
          </div>

          <article className={styles.buyColumn}>
            {/* Includes the game so the H1 matches the whole query, not half
                of it — "ancient arc raiders" rather than just "ancient". */}
            <h1>{productDisplayName(product)}</h1>

            {/* The seller's own copy moved out of this column and down to
                .aboutPanel — see the note on that class. The buy panel now
                carries only what a purchase decision needs. */}

            <div className={styles.badgeRow}>
              <span className={styles.badgeUndetected}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                </svg>
                Undetected (Working)
              </span>
              <span className={styles.badgeDelivery}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
                </svg>
                Instant Delivery
              </span>
            </div>

            {/* Price of the selected plan, announced politely so a screen
                reader hears it change without focus leaving the plan card
                that changed it. */}
            {(() => {
              const [head, cents, suffix] = splitMoney(
                money(selectedVariant?.price ?? null, product.currency)
              );
              return (
                <p className={styles.price} aria-live="polite">
                  {head}
                  {cents ? <span className={styles.priceCents}>{cents}</span> : null}
                  {suffix}
                </p>
              );
            })()}

            <div className={styles.priceQtyRow}>
              <span className={styles.selectLabel} id="select-option-label">
                {t("product.selectOption")}
              </span>

              <div className={styles.qtyStepper}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
                  disabled={quantity <= minQuantity || isCheckingOut}
                  aria-label={`${t("product.quantity")} −`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                  disabled={quantity >= 999 || isCheckingOut}
                  aria-label={`${t("product.quantity")} +`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.planGrid} role="radiogroup" aria-labelledby="select-option-label">
              {variants.map((variant) => {
                const stock = typeof variant.stock === "number" && variant.stock >= 0 ? variant.stock : null;
                return (
                  <button
                    key={variant.id}
                    className={`${styles.planCard} ${
                      selectedVariantId === variant.id ? styles.planCardActive : ""
                    }`}
                    // Selection only. This used to fire checkoutNow() straight
                    // from the plan card, so a single click on a price sent
                    // someone to Stripe with no confirmation and no way to buy
                    // anything alongside it.
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setAdded(false);
                    }}
                    role="radio"
                    aria-checked={selectedVariantId === variant.id}
                    disabled={isCheckingOut}
                  >
                    <div className={styles.planTopRow}>
                      <span className={styles.planName}>{variant.name}</span>
                      <span className={styles.planStock}>
                        IN STOCK{stock !== null ? ` (${stock})` : ""}
                      </span>
                    </div>
                    <div className={styles.planBottomRow}>
                      <span className={styles.planPrice}>
                        {money(variant.price, product.currency)}
                      </span>
                      {selectedVariantId === variant.id ? (
                        <svg className={styles.planCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.buyActions}>
              <button
                type="button"
                className={styles.addToCartBtn}
                onClick={() => {
                  const variant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
                  if (!variant || variant.price === null) return;
                  addToCart({
                    productId: product.id,
                    productName: productDisplayName(product),
                    image: galleryImages[0] ?? "",
                    quantity: resolveCheckoutQuantity(),
                    // A synthetic variant stands in for a product with no real
                    // options, and its id is fabricated — sending it to
                    // checkout would fail to resolve.
                    ...(variant.isSynthetic ? {} : { variantId: variant.id, variantName: variant.name }),
                    unitPrice: variant.price,
                    currency: product.currency || "USD",
                    status: "undetected",
                  });
                  setAdded(true);
                  openCart();
                }}
                disabled={isCheckingOut || variants.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {added ? t("product.added") : t("product.addToCart")}
              </button>

              <button
                type="button"
                className={styles.buyNowBtn}
                onClick={() => {
                  const variant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
                  void checkoutNow(variant);
                }}
                disabled={isCheckingOut || variants.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                {isCheckingOut ? `${t("common.loading")}…` : t("product.buyNow")}
              </button>
            </div>

            {minQuantity > 1 ? (
              <p className={styles.minimumHint}>Minimum quantity for this product: {minQuantity}</p>
            ) : null}

            {notice ? <p className={styles.notice}>{notice}</p> : null}
          </article>
        </section>
        </div>

        {/* The seller's own copy, full width below the buy area. */}
        {detailContent.descriptionParagraphs.length > 0 && (
          <section className={styles.aboutPanel}>
            <h2 className={styles.aboutTitle}>{t("product.description")}</h2>
            {detailContent.descriptionParagraphs.map((paragraph, i) => (
              <p key={i} className={styles.descText}>{paragraph}</p>
            ))}
          </section>
        )}

        {(detailContent.featureTabs.length > 0 ||
          detailContent.requirements.length > 0 ||
          showRequirements) && (
          <section className={styles.descPanel}>
            {/* Information panel */}
            {(detailContent.requirements.length > 0 || showRequirements) && (
              <div className="panel">
                <header className="panel-header">Information</header>
                <div className="panel-body">
                  <ul className={styles.descBullets}>
                    {(detailContent.requirements.length > 0 ? detailContent.requirements : displayRequirements).map((req, i) => (
                      <li key={i}><strong>{req.label}:</strong> {req.value}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* One forum panel per feature category (ESP, Aimbot, Misc…) */}
            {detailContent.featureTabs.length > 0 && (
              <div className={styles.descTabsGrid}>
                {detailContent.featureTabs.map((tab) => {
                  const first = tab.items[0] ?? "";
                  const firstIsSubtitle = first.length > 18 && first.endsWith(".");
                  const subtitle = firstIsSubtitle ? first : tabDescription(tab.title);
                  const bullets = firstIsSubtitle ? tab.items.slice(1) : tab.items;
                  return (
                    <div key={tab.title} className="panel">
                      <header className="panel-header">{tab.title.toUpperCase()}</header>
                      <div className="panel-body">
                        {subtitle && <p className={styles.descTabSubtitle}>{subtitle}</p>}
                        <ul className={styles.descTabItems}>
                          {bullets.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Editorial content, when this product has any. Inside <main> so it is
            part of the initial HTML rather than appended after the footer. */}
        {seoContent && (
          <ProductSeoSections
            content={seoContent}
            productName={product.name}
            gameName={product.groupName || product.categoryName || ""}
          />
        )}

        {/* Sideways navigation. Every product page linked to its category and
            nowhere else, which left each one a dead end for a visitor arriving
            from search — and kept the catalogue's internal links entirely
            top-down. */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection} aria-labelledby="related-products">
            <h2 id="related-products" className={styles.relatedTitle}>
              Other {product.groupName || product.categoryName || "cheats"} options
            </h2>
            <ul className={styles.relatedList}>
              {relatedProducts.map((other) => {
                const prices = [
                  typeof other.price === "number" ? other.price : null,
                  ...(other.variants ?? []).map((v) =>
                    typeof v.price === "number" ? v.price : null
                  ),
                ].filter((p): p is number => p !== null);
                const from = prices.length ? Math.min(...prices) : null;

                return (
                  <li key={other.id}>
                    <Link href={productHref(other)} className={styles.relatedLink}>
                      {/* Plain <img>: product art comes from whatever host
                          SellAuth hands us, and next/image throws on an
                          unconfigured domain — which would blank the whole page
                          rather than drop one thumbnail. */}
                      <img
                        className={styles.relatedThumb}
                        src={other.image || "/placeholders/product-image-not-added.svg"}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={320}
                        height={180}
                      />
                      <span className={styles.relatedInfo}>
                        <span className={styles.relatedName}>{other.name}</span>
                        {from !== null && (
                          <span className={styles.relatedPrice}>
                            from {money(from, other.currency || "USD")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />

      {/* Checkout modal removed — Buy Now goes directly to Stripe. */}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          {/* Close */}
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Prev */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length); }}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${product.name} preview ${lightboxIndex + 1}`}
              className={styles.lightboxImg}
            />
          </div>

          {/* Next */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % galleryImages.length); }}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
