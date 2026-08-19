"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildCategoryTiles, canonicalGroupSlug } from "@/lib/category-tiles";
import { productHref, productSlugFromName } from "@/lib/product-route";
import { guideForProduct } from "@/lib/product-guides";
import { SETUP_SECTIONS as SECTIONS } from "@/lib/setup-guides";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { SellAuthProduct, StorefrontData } from "@/types/sellauth";

// Setup sections live in @/lib/setup-guides; per-product guides in
// @/lib/product-guides.

// ─────────────────────────────────────────────────────────────────────────────

interface GameGroup {
  slug: string;
  name: string;
  products: SellAuthProduct[];
}

/** Group live storefront products under the same canonical game slug the
 *  homepage tiles use, so the sidebar tracks the store with no code change. */
function buildGameGroups(data: StorefrontData | null): GameGroup[] {
  if (!data) return [];

  const byslug = new Map<string, SellAuthProduct[]>();
  for (const product of data.products || []) {
    const slug = canonicalGroupSlug((product.groupName || product.categoryName || "").trim());
    if (!slug) continue;
    const bucket = byslug.get(slug);
    if (bucket) bucket.push(product);
    else byslug.set(slug, [product]);
  }

  // buildCategoryTiles already resolves curated display names and ordering.
  return buildCategoryTiles(data)
    .map((tile) => ({
      slug: tile.slug,
      name: tile.name,
      products: (byslug.get(tile.slug) || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.products.length > 0);
}

type Selection =
  | { kind: "section"; id: string }
  | { kind: "product"; slug: string };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width="14"
      height="14"
      aria-hidden
      className={`guide-cat-chevron ${open ? "guide-cat-chevron-open" : ""}`}
    >
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GuidePage() {
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [selection, setSelection] = useState<Selection>({ kind: "section", id: SECTIONS[0].id });
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [setupOpen, setSetupOpen] = useState(true);

  useEffect(() => {
    let active = true;
    fetchStorefrontClient({ force: false })
      .then((data) => {
        if (active) setStorefront(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const gameGroups = useMemo(() => buildGameGroups(storefront), [storefront]);

  const activeSection =
    selection.kind === "section"
      ? SECTIONS.find((s) => s.id === selection.id) ?? SECTIONS[0]
      : null;

  const activeProduct = useMemo(() => {
    if (selection.kind !== "product") return null;
    for (const group of gameGroups) {
      const match = group.products.find(
        (p) => productSlugFromName(p.name, p.id) === selection.slug
      );
      if (match) return { product: match, group };
    }
    return null;
  }, [selection, gameGroups]);

  function toggleGroup(slug: string) {
    setOpenGroups((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  const productGuide = activeProduct ? guideForProduct(activeProduct.product) : null;
  const sectionGuide = activeSection?.content ?? null;

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <main className="guide-shell">
        {/* Sidebar */}
        <aside className="guide-sidebar">
          <div className="guide-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden className="guide-sidebar-icon">
              <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 7h6M9 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <h1 className="guide-sidebar-h1">Setup Guides</h1>
          </div>

          <nav className="guide-nav">
            {/* General setup sections */}
            <div className="guide-cat">
              <button
                type="button"
                className="guide-cat-toggle"
                aria-expanded={setupOpen}
                onClick={() => setSetupOpen((v) => !v)}
              >
                <ChevronIcon open={setupOpen} />
                <span className="guide-cat-name">Setup Guide</span>
              </button>
              {setupOpen && (
                <div className="guide-cat-items">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={`guide-nav-item ${
                        selection.kind === "section" && selection.id === section.id ? "guide-nav-active" : ""
                      }`}
                      onClick={() => setSelection({ kind: "section", id: section.id })}
                    >
                      <span className="guide-nav-emoji" aria-hidden>{section.icon}</span>
                      {section.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Game categories → products */}
            {gameGroups.map((group) => {
              const open = openGroups.includes(group.slug);
              return (
                <div className="guide-cat" key={group.slug}>
                  <button
                    type="button"
                    className="guide-cat-toggle"
                    aria-expanded={open}
                    onClick={() => toggleGroup(group.slug)}
                  >
                    <ChevronIcon open={open} />
                    <span className="guide-cat-name">{group.name}</span>
                  </button>
                  {open && (
                    <div className="guide-cat-items">
                      {group.products.map((product) => {
                        const slug = productSlugFromName(product.name, product.id);
                        return (
                          <button
                            key={product.id}
                            type="button"
                            className={`guide-nav-item guide-nav-product ${
                              selection.kind === "product" && selection.slug === slug ? "guide-nav-active" : ""
                            }`}
                            onClick={() => setSelection({ kind: "product", slug })}
                          >
                            {product.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {storefront === null && <p className="guide-nav-loading">Loading products…</p>}
          </nav>

          <div className="guide-sidebar-footer">
            <a href="/support" className="guide-support-link">
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <path d="M4.8 13.2a7.2 7.2 0 1 1 14.4 0v4.1a2.2 2.2 0 0 1-2.2 2.2h-.6a2.2 2.2 0 0 1-2.2-2.2v-3a2.2 2.2 0 0 1 2.2-2.2h2.2M7.6 12.1H6.4a2.2 2.2 0 0 0-2.2 2.2v3a2.2 2.2 0 0 0 2.2 2.2h.6a2.2 2.2 0 0 0 2.2-2.2v-3a2.2 2.2 0 0 0-1.6-2.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open Support Ticket
            </a>
          </div>
        </aside>

        {/* Content */}
        <article className="guide-content">
          <div className="guide-breadcrumb">
            <span>Guide</span>
            <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {activeProduct ? (
              <>
                <span>{activeProduct.group.name}</span>
                <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{activeProduct.product.name}</span>
              </>
            ) : (
              <span>{activeSection?.title}</span>
            )}
          </div>

          {activeProduct ? (
            <div className="guide-section-content" key={selection.kind === "product" ? selection.slug : "none"}>
              <h2>{activeProduct.product.name}</h2>
              <p className="guide-product-meta">
                {activeProduct.group.name}
                <span className="guide-product-sep" aria-hidden="true" />
                <Link href={productHref(activeProduct.product)} className="guide-link">
                  View product →
                </Link>
              </p>
              {productGuide ?? <EmptyGuide />}
            </div>
          ) : (
            <div className="guide-section-content" key={activeSection?.id}>
              <h2>{activeSection?.title}</h2>
              {sectionGuide ?? <EmptyGuide />}
            </div>
          )}
        </article>
      </main>

      <style>{`
        .guide-shell {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: calc(100vh - 64px);
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px 80px;
          gap: 0;
        }

        /* ── Sidebar ── */
        .guide-sidebar {
          position: sticky;
          top: 24px;
          height: fit-content;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          padding: 24px 0;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .guide-sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px 16px;
          font-family: var(--font-brand);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .guide-sidebar-icon { color: var(--accent); }
        /* The sidebar label is the page's H1. Inheriting the header's type
           keeps it looking like a label rather than a heading. */
        .guide-sidebar-h1 {
          font: inherit;
          color: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          margin: 0;
        }

        .guide-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 8px;
          flex: 1;
        }
        .guide-nav-loading {
          margin: 8px 12px;
          font-size: 0.82rem;
          color: var(--text-dim);
        }

        /* Category dropdown */
        .guide-cat + .guide-cat { margin-top: 2px; }
        .guide-cat-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.86rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
        }
        .guide-cat-toggle:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
        .guide-cat-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .guide-cat-chevron {
          flex: 0 0 auto;
          color: var(--text-dim);
          transition: transform var(--dur-base) var(--ease-out);
        }
        .guide-cat-chevron-open { transform: rotate(90deg); }

        .guide-cat-items {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin: 2px 0 6px;
          padding-left: 10px;
          border-left: 1px solid var(--border);
          margin-left: 17px;
        }

        .guide-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
          width: 100%;
        }
        .guide-nav-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
        .guide-nav-product { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .guide-nav-active {
          background: var(--accent-dim) !important;
          color: var(--accent-hover) !important;
          font-weight: 600;
        }
        .guide-nav-emoji { font-size: 1rem; line-height: 1; }

        .guide-sidebar-footer {
          padding: 16px 16px 0;
          border-top: 1px solid var(--border);
          margin-top: 16px;
        }
        .guide-support-link {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.82rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--dur-base) var(--ease-out);
        }
        .guide-support-link:hover { color: var(--accent-hover); }

        /* ── Content ── */
        .guide-content {
          padding: 32px 0 0 48px;
          min-width: 0;
        }
        .guide-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-dim);
          margin-bottom: 24px;
        }

        .guide-section-content h2 {
          margin: 0 0 12px;
          font-family: var(--font-brand);
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .guide-section-content h3 {
          margin: 28px 0 10px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .guide-section-content p {
          margin: 0 0 16px;
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 0.95rem;
        }
        .guide-section-content code {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 0.86em;
          color: #fff;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
          word-break: break-word;
        }
        .guide-link { color: var(--accent-hover); text-decoration: underline; text-underline-offset: 3px; }

        .guide-product-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: var(--text-dim);
        }
        .guide-product-sep {
          width: 1px;
          height: 12px;
          background: var(--border-strong);
        }

        .guide-list {
          margin: 0 0 16px;
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .guide-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.93rem;
          line-height: 1.6;
          padding-left: 0;
        }
        .guide-list li::before {
          content: '';
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          margin-top: 7px;
        }
        .guide-list strong { color: var(--text-primary); }

        /* Step */
        .guide-step {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .guide-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--accent-ink);
          font-size: 0.78rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .guide-step-body strong {
          display: block;
          color: var(--text-primary);
          font-size: 0.95rem;
          margin-bottom: 4px;
        }
        .guide-step-body div {
          color: var(--text-muted);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        /* Note / Warn */
        .guide-note, .guide-warn {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.87rem;
          line-height: 1.55;
          margin: 16px 0;
        }
        .guide-note {
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          color: var(--text-secondary);
        }
        .guide-warn {
          background: rgba(234,179,8,0.07);
          border: 1px solid rgba(234,179,8,0.22);
          color: #d4b83a;
        }
        .guide-note-icon { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
        .guide-warn-icon { color: #d4b83a; flex-shrink: 0; margin-top: 1px; }

        /* Screenshot inside a guide */
        .guide-figure {
          margin: 16px 0;
        }
        .guide-figure img {
          display: block;
          max-width: 100%;
          height: auto;
          border: 1px solid var(--border);
          background: var(--surface-1);
        }
        .guide-figure figcaption {
          margin-top: 6px;
          font-size: 0.76rem;
          color: var(--text-dim);
        }

        /* Multi-line commands. Sits on the page surface rather than a raised one
           so it reads as a terminal, and scrolls itself instead of stretching
           the content column when a line is long. */
        .guide-code-wrap { position: relative; }
        .guide-code {
          margin: 0 0 16px;
          padding: 18px 20px;
          padding-right: 92px;   /* clear the copy button */
          overflow-x: auto;
          border: 1px solid var(--border);
          border-left: 2px solid var(--border-strong);
          background: var(--surface-0);
          font-size: 0.88rem;
          line-height: 1.95;
          color: #fff;
          tab-size: 2;
        }
        .guide-copy {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border: 1px solid var(--border-strong);
          background: var(--surface-2);
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out);
        }
        .guide-copy:hover { color: var(--text-primary); border-color: var(--border-accent); }
        .guide-copy-done { color: var(--accent); border-color: var(--border-accent); }
        .guide-code code {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
          white-space: pre;
          color: inherit;
          background: none;
          border: 0;
          padding: 0;
          font-size: inherit;
        }

        /* Download row */
        .guide-download {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 10px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          background: var(--surface-1);
        }
        .guide-download-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .guide-download-body strong { font-size: 0.92rem; color: var(--text-primary); }
        .guide-download-body span { font-size: 0.82rem; color: var(--text-muted); }
        .guide-download-btn {
          flex: 0 0 auto;
          padding: 8px 18px;
          background: var(--accent);
          color: var(--accent-ink);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: filter var(--dur-base) var(--ease-out);
        }
        .guide-download-btn:hover { filter: brightness(1.1); }

        /* Error -> fix pairs */
        .guide-fixes {
          margin: 0 0 16px;
          border: 1px solid var(--border);
        }
        .guide-fixes > div {
          padding: 12px 14px;
          background: var(--surface-1);
        }
        .guide-fixes > div + div { border-top: 1px solid var(--border); }
        .guide-fixes dt {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .guide-fixes dd {
          margin: 5px 0 0;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--text-muted);
        }

        /* Empty placeholder — shown until a guide is written */
        .guide-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 48px 24px;
          margin-top: 8px;
          border: 1px dashed var(--border-strong);
          background: var(--surface-1);
          text-align: center;
        }
        .guide-empty strong {
          font-family: var(--font-brand);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .guide-empty span {
          font-size: 0.85rem;
          color: var(--text-dim);
        }

        @media (max-width: 860px) {
          .guide-shell {
            grid-template-columns: 1fr;
            padding: 0 16px 60px;
          }
          .guide-sidebar {
            position: static;
            max-height: none;
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .guide-content { padding: 0; }
        }
      `}</style>

      <SiteFooter />
    </div>
  );
}

function EmptyGuide() {
  return (
    <div className="guide-empty">
      <strong>Guide coming soon</strong>
      <span>This one hasn&apos;t been written yet.</span>
    </div>
  );
}
