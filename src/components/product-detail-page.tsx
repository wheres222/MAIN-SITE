"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
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

interface ProductVideoPreview {
  url: string;
  title: string;
  description: string;
  poster?: string;
}

const PRODUCT_VIDEO_PREVIEW_BY_ID: Record<number, ProductVideoPreview> = {
  638033: {
    url: "https://www.youtube.com/watch?v=bo1rVhgk0mk",
    title: "Rust External Preview",
    description: "Live test preview for Division Rust External.",
  },
  // Example:
  // 637803: {
  //   url: "https://cdn.example.com/previews/rust-mek.mp4",
  //   title: "See It In Action",
  //   description: "Rust gameplay preview for MEK external.",
  //   poster: "https://cdn.example.com/previews/rust-mek-poster.jpg",
  // },
};

const PRODUCT_VIDEO_PREVIEW_BY_GROUP: Record<string, ProductVideoPreview> = {
  rust: {
    url: "https://odysee.com/Arc-Raiders-Cheat-Showcase:9?r=FVZ5k7b3fkgFTEhaHP4YJsvAEAkxdbAH",
    title: "Rust Cheat Showcase",
    description: "Live gameplay showcase.",
  },
};

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

    if (!isPostPaymentOnlyCopy(line)) {
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

  if (value.includes("weapon")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5.1 11.3h6.6l2.1-2.1h3.6l1.5 1.5-1.5 1.6h-3.6l-2.1 2.1H8.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 11.3V9.6M7.7 11.3V9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("player exploit")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9.2" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.6 16.4c1-1.8 2.2-2.6 3.6-2.6s2.6.8 3.6 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="m16.2 7.5 1.2 2.2 2.5.3-1.8 1.8.5 2.6-2.4-1.1-2.2 1.2.3-2.6-1.9-1.7 2.5-.5 1.3-2.2Z" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("player esp") || value.includes("player")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8.1" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 16.2c.9-1.6 2.1-2.3 3.3-2.3 1.3 0 2.5.7 3.3 2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="15.9" cy="10.4" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13.2 16.4c.7-1.4 1.6-2 2.7-2 .9 0 1.8.4 2.6 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("entity")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="7.2" cy="9.2" r="1.6" fill="currentColor" />
        <circle cx="11.2" cy="7.3" r="1.6" fill="currentColor" />
        <circle cx="15.1" cy="7.9" r="1.6" fill="currentColor" />
        <circle cx="17.4" cy="11.4" r="1.6" fill="currentColor" />
        <path d="M6.5 15c1.5-1.6 3.1-2.4 5-2.4 1.8 0 3.5.8 5 2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("resource")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m7.2 16.6 6.6-6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m12.8 7.8 3.6-3.6 2.2 2.2-3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.6 18.2 8.8 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

  if (value.includes("loot")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5.1" y="7.5" width="13.8" height="9.6" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.2 10.4h3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("vehicle")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5.1 13.6h13.8l-1.4-4.6H6.5l-1.4 4.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="8.3" cy="15.9" r="1.5" fill="currentColor" />
        <circle cx="15.7" cy="15.9" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("food")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 7.3c2.9 0 5.2 2.2 5.2 5.2 0 3.2-2.3 5.8-5.2 5.8s-5.2-2.6-5.2-5.8c0-3 2.3-5.2 5.2-5.2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.3c0-1.6.9-2.9 2.4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("trap")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6.8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8.6v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="15.8" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("item")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 4.9 6.1 3.4V15L12 18.5 5.9 15V8.3L12 4.9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 4.9v6.4m0 0 6.1-3m-6.1 3-6.1-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("movement")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="14.4" cy="6.8" r="1.5" fill="currentColor" />
        <path d="m9.4 12.5 2.9-2.1 2.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="m8.1 16.8 2.8-2.3 2.2 1.2M12.9 13.4l2.7 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("config")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4.8v2M12 17.2v2M19.2 12h-2M6.8 12h-2M17.1 6.9l-1.4 1.4M8.3 15.7l-1.4 1.4M17.1 17.1l-1.4-1.4M8.3 8.3 6.9 6.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("setting")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6.7h12M6 12h12M6 17.3h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="6.7" r="1.4" fill="currentColor" />
        <circle cx="14.7" cy="12" r="1.4" fill="currentColor" />
        <circle cx="10.8" cy="17.3" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("trigger")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6.8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.6v2.4M12 14v2.4M7.6 12H10M14 12h2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("npc")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="6.5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="10" cy="10.4" r="1" fill="currentColor" />
        <circle cx="14" cy="10.4" r="1" fill="currentColor" />
        <path d="M9.2 17.4h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("world")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 12h14.4M12 4.8c1.9 2 1.9 12.4 0 14.4M12 4.8c-1.9 2-1.9 12.4 0 14.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("visual") || value === "esp" || value.endsWith(" esp")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.8 12s2.9-4.6 8.2-4.6 8.2 4.6 8.2 4.6-2.9 4.6-8.2 4.6S3.8 12 3.8 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (value.includes("misc") || value.includes("other")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5.2" y="7" width="13.6" height="10.4" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.4 7V5.6h7.2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9.3 11.1h5.4M9.3 13.9h3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (value.includes("info") || value.includes("general")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="9" r="1" fill="currentColor" />
        <path d="M12 11.6v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.2" y="5.2" width="5.4" height="5.4" rx="1" fill="currentColor" />
      <rect x="13.4" y="5.2" width="5.4" height="5.4" rx="1" fill="currentColor" />
      <rect x="5.2" y="13.4" width="5.4" height="5.4" rx="1" fill="currentColor" />
      <rect x="13.4" y="13.4" width="5.4" height="5.4" rx="1" fill="currentColor" />
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
  const videoPreview = useMemo(() => resolveProductVideoPreview(product), [product]);
  const videoPreviewEmbed = useMemo(
    () => (videoPreview ? videoEmbedUrl(videoPreview.url) : null),
    [videoPreview]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  const showRequirements = !isAccountsOrVpnProduct(product);

  const displayRequirements = showRequirements
    ? [
        { label: "Supported OS", value: "Windows 10/11" },
        { label: "Supported CPU", value: "Intel / AMD" },
      ]
    : [];

  const hasDetailSections =
    showRequirements ||
    detailContent.featureTabs.length > 0;

  useEffect(() => {
    setOpenTabs([]);
  }, [detailContent.featureTabs, product.id]);

  useEffect(() => {
    setActiveImageIndex(0);
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
        const idempotencyKey = [
          paymentMethod.trim().toLowerCase(),
          String(product.id),
          String(checkoutVariantId || 0),
          String(checkoutQuantity),
        ].join("|");

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-idempotency-key": idempotencyKey,
          },
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
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Store", href: "/#games" },
            { label: product.groupName || product.categoryName || "Products", href: product.groupName ? `/categories?slug=${encodeURIComponent(product.groupName.toLowerCase().replace(/\s+/g, "-"))}` : "/categories" },
            { label: product.name },
          ]}
        />
        <div className={styles.showreel}>
        <section className={styles.topGrid}>
          <div>
            <article className={styles.imagePanel}>
              {/* ── Main display: video or first image ── */}
              <div className={styles.mainDisplay}>
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

              {/* ── Thumbnail row ── */}
              {(() => {
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
                          aria-label={`View image ${i + 1}`}
                        >
                          <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </article>
          </div>

          <article className={styles.buyColumn}>
            <h1>{product.name}</h1>

            <div className={styles.badgeRow}>
              <span className={styles.badgeInstant}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
                Instant Delivery
              </span>
              <span className={styles.badgeUndetected}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Undetected (Working)
              </span>
            </div>

            <div className={styles.priceQtyRow}>
              <p className={styles.price}>{money(selectedUnitPrice, product.currency)}</p>
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

            <div className={styles.planGrid}>
              {variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                const stock = typeof variant.stock === "number" && variant.stock >= 0 ? variant.stock : null;
                return (
                  <button
                    key={variant.id}
                    className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""}`}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={isCheckingOut}
                  >
                    <div className={styles.planTopRow}>
                      <span className={styles.planName}>{variant.name}</span>
                      <span className={styles.planStock}>
                        IN STOCK{stock !== null ? ` (${stock})` : ""}
                      </span>
                    </div>
                    <span className={styles.planPrice}>
                      {money(variant.price, product.currency)}
                    </span>
                  </button>
                );
              })}
            </div>

            {minQuantity > 1 ? (
              <p className={styles.minimumHint}>Minimum quantity for this product: {minQuantity}</p>
            ) : null}

            <div className={styles.actionRow}>
              <button type="button" className={styles.addToCartBtn} onClick={addToCart}>
                Add To Cart
              </button>
              <button
                type="button"
                className={styles.buyNowBtn}
                onClick={checkoutNow}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? "Processing…" : "Buy Now"}
              </button>
            </div>

            {notice ? <p className={styles.notice}>{notice}</p> : null}
          </article>
        </section>
        </div>

        {detailContent.featureTabs.length > 0 ? (
          <section className={styles.detailsStack}>
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
        ) : null}
      </main>

      <SiteFooter />

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
              ‹
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
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
