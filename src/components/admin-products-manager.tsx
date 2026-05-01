"use client";

import { useEffect, useState, useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// ── Types ────────────────────────────────────────────────────────────────────

interface ShopCategory {
  id: string;
  sellauth_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
}

interface ShopProduct {
  id: string;
  sellauth_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface ShopVariant {
  id: string;
  sellauth_id: string | null;
  product_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_active: boolean;
}

interface MigrateStats {
  categories: number;
  products: number;
  variants: number;
  errors: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const css = {
  card: {
    background: "#0d1017",
    border: "1px solid #1a1d26",
    borderRadius: 10,
    padding: "14px 16px",
  } as React.CSSProperties,
  label: { color: "#8e98ab", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const },
  value: { color: "#eef3ff", fontSize: "0.9rem", fontWeight: 600 },
  btn: (variant: "primary" | "danger" | "ghost" = "ghost"): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
    background: variant === "primary" ? "var(--accent, #2563eb)" : "transparent",
    color: variant === "danger" ? "#ff8a9f" : variant === "primary" ? "#fff" : "#8e98ab",
    borderColor: variant === "danger" ? "rgba(179,64,94,0.4)" : variant === "primary" ? "transparent" : "#2a2d36",
  }),
  pill: (active: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 8px", borderRadius: 999,
    fontSize: "0.68rem", fontWeight: 700,
    background: active ? "rgba(18,67,45,0.7)" : "rgba(50,30,30,0.7)",
    color: active ? "#2fe496" : "#ff8a9f",
    border: `1px solid ${active ? "rgba(31,124,80,0.4)" : "rgba(179,64,94,0.3)"}`,
    cursor: "pointer",
    userSelect: "none" as const,
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminProductsManager() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [variants, setVariants] = useState<ShopVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<MigrateStats | null>(null);
  const [search, setSearch] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<{ variantId: string; value: string } | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // ── Data loading ─────────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop-products");
      const json = await res.json() as { categories: ShopCategory[]; products: ShopProduct[]; variants: ShopVariant[] };
      setCategories(json.categories ?? []);
      setProducts(json.products ?? []);
      setVariants(json.variants ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Migration ─────────────────────────────────────────────────────────────

  async function runMigration() {
    if (!confirm("This will import/update all SellAuth products into your database. Continue?")) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch("/api/admin/migrate-from-sellauth", { method: "POST" });
      const json = await res.json() as { ok: boolean; stats: MigrateStats };
      setMigrateResult(json.stats);
      await loadData();
    } finally {
      setMigrating(false);
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function patch(table: string, id: string, updates: Record<string, unknown>) {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      await fetch("/api/admin/shop-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, updates }),
      });
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  }

  async function toggleActive(table: string, id: string, current: boolean) {
    const update = { is_active: !current };
    if (table === "shop_products") {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    } else if (table === "shop_variants") {
      setVariants(prev => prev.map(v => v.id === id ? { ...v, is_active: !current } : v));
    } else if (table === "shop_categories") {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    }
    await patch(table, id, update);
  }

  async function savePrice(variantId: string, raw: string) {
    const price = parseFloat(raw);
    if (isNaN(price) || price < 0) { setEditingPrice(null); return; }
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, price } : v));
    setEditingPrice(null);
    await patch("shop_variants", variantId, { price });
  }

  async function deleteRow(table: string, id: string, label: string) {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/shop-products?table=${table}&id=${id}`, { method: "DELETE" });
    if (table === "shop_products") {
      setProducts(prev => prev.filter(p => p.id !== id));
      setVariants(prev => prev.filter(v => v.product_id !== id));
    } else if (table === "shop_variants") {
      setVariants(prev => prev.filter(v => v.id !== id));
    } else if (table === "shop_categories") {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const categoryMap = useMemo(() =>
    new Map(categories.map(c => [c.id, c])), [categories]);

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ShopVariant[]>();
    variants.forEach(v => {
      const list = map.get(v.product_id) ?? [];
      list.push(v);
      map.set(v.product_id, list);
    });
    return map;
  }, [variants]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (categoryMap.get(p.category_id ?? "")?.name ?? "").toLowerCase().includes(q)
    );
  }, [products, search, categoryMap]);

  const grouped = useMemo(() => {
    const map = new Map<string, { category: ShopCategory | null; products: ShopProduct[] }>();
    filtered.forEach(p => {
      const catId = p.category_id ?? "__none__";
      const cat = p.category_id ? (categoryMap.get(p.category_id) ?? null) : null;
      if (!map.has(catId)) map.set(catId, { category: cat, products: [] });
      map.get(catId)!.products.push(p);
    });
    return [...map.values()].sort((a, b) =>
      (a.category?.name ?? "Uncategorised").localeCompare(b.category?.name ?? "Uncategorised")
    );
  }, [filtered, categoryMap]);

  // ── Render ────────────────────────────────────────────────────────────────

  const totalVariants = variants.length;
  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />
      <main className="shell subpage-wrap" style={{ maxWidth: 960 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: "#f1f5ff", fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px" }}>
            Product Manager
          </h1>
          <p style={{ color: "#8e98ab", fontSize: "0.875rem", margin: 0 }}>
            Your own product catalogue — independent of SellAuth.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Categories", value: categories.length },
            { label: "Products", value: `${activeProducts} / ${products.length} active` },
            { label: "Variants", value: totalVariants },
          ].map(s => (
            <div key={s.label} style={css.card}>
              <div style={css.label}>{s.label}</div>
              <div style={{ ...css.value, fontSize: "1.3rem", marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Import button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={runMigration}
            disabled={migrating}
            style={{
              ...css.btn("primary"),
              padding: "9px 18px",
              fontSize: "0.85rem",
              opacity: migrating ? 0.6 : 1,
            }}
          >
            {migrating ? "⟳ Importing from SellAuth…" : "⬇ Import / Sync from SellAuth"}
          </button>
          <button onClick={loadData} style={css.btn()} disabled={loading}>
            {loading ? "Loading…" : "↺ Refresh"}
          </button>
          {/* Export buttons */}
          <a
            href="/api/admin/export/sellauth?format=json"
            download
            style={{
              ...css.btn("ghost"),
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ↓ Export JSON
          </a>
          <a
            href="/api/admin/export/sellauth?format=csv"
            download
            style={{
              ...css.btn("ghost"),
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ↓ Export CSV
          </a>
          <span style={{ color: "#4a5060", fontSize: "0.78rem" }}>
            Import is safe to run multiple times — upserts, never duplicates.
          </span>
        </div>

        {/* Migration result */}
        {migrateResult && (
          <div style={{
            ...css.card,
            border: `1px solid ${migrateResult.errors.length ? "rgba(179,64,94,0.4)" : "rgba(31,124,80,0.4)"}`,
            background: migrateResult.errors.length ? "rgba(92,24,41,0.2)" : "rgba(18,67,45,0.2)",
            marginBottom: 20,
          }}>
            <div style={{ color: migrateResult.errors.length ? "#ff8a9f" : "#2fe496", fontWeight: 700, marginBottom: 6 }}>
              {migrateResult.errors.length ? "Import completed with errors" : "✓ Import successful"}
            </div>
            <div style={{ color: "#8e98ab", fontSize: "0.82rem" }}>
              {migrateResult.categories} categories · {migrateResult.products} products · {migrateResult.variants} variants imported
            </div>
            {migrateResult.errors.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#ff8a9f", fontSize: "0.78rem" }}>
                {migrateResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                {migrateResult.errors.length > 10 && <li>…and {migrateResult.errors.length - 10} more</li>}
              </ul>
            )}
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder="Search products or categories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: "1px solid #2a2d36", background: "#0a0d12",
            color: "#eef3ff", fontSize: "0.9rem", marginBottom: 14,
            outline: "none", boxSizing: "border-box",
          }}
        />

        {/* Product list */}
        {loading ? (
          <p style={{ color: "#8e98ab", padding: "32px 0", textAlign: "center" }}>Loading…</p>
        ) : products.length === 0 ? (
          <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
            <div style={{ color: "#8e98ab", marginBottom: 12 }}>No products yet.</div>
            <div style={{ color: "#4a5060", fontSize: "0.82rem" }}>
              Click &ldquo;Import / Sync from SellAuth&rdquo; to pull in your entire product catalogue.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {grouped.map(({ category, products: catProducts }) => (
              <div key={category?.id ?? "__none__"}>
                {/* Category header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginBottom: 8, padding: "6px 0",
                  borderBottom: "1px solid #1a1d26",
                }}>
                  {category?.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.image_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                  )}
                  <span style={{ color: "#f1f5ff", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {category?.name ?? "Uncategorised"}
                  </span>
                  <span style={{ color: "#4a5060", fontSize: "0.75rem" }}>{catProducts.length} products</span>
                  {category && (
                    <button
                      onClick={() => toggleActive("shop_categories", category.id, category.is_active)}
                      style={{ ...css.pill(category.is_active), marginLeft: "auto" }}
                    >
                      {category.is_active ? "Active" : "Hidden"}
                    </button>
                  )}
                </div>

                {/* Products */}
                <div style={{ display: "grid", gap: 6 }}>
                  {catProducts.map(product => {
                    const pvariants = variantsByProduct.get(product.id) ?? [];
                    const expanded = expandedProducts.has(product.id);
                    const isSaving = Boolean(saving[product.id]);

                    return (
                      <div key={product.id} style={{
                        ...css.card,
                        border: `1px solid ${product.is_active ? "#1e2230" : "#2a1a1a"}`,
                        opacity: isSaving ? 0.7 : 1,
                        transition: "opacity 0.15s",
                      }}>
                        {/* Product row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => setExpandedProducts(prev => {
                              const next = new Set(prev);
                              next.has(product.id) ? next.delete(product.id) : next.add(product.id);
                              return next;
                            })}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#4a5060", fontSize: "0.75rem", padding: "2px 4px",
                              flexShrink: 0,
                            }}
                            title={expanded ? "Collapse" : "Expand variants"}
                          >
                            {expanded ? "▼" : "▶"}
                          </button>

                          <span style={{ flex: 1, color: "#eef3ff", fontWeight: 600, fontSize: "0.88rem", minWidth: 140 }}>
                            {product.name}
                          </span>

                          <span style={{ color: "#4a5060", fontSize: "0.75rem", flexShrink: 0 }}>
                            {pvariants.length} variant{pvariants.length !== 1 ? "s" : ""}
                            {pvariants.length > 0 && ` · from $${Math.min(...pvariants.map(v => v.price)).toFixed(2)}`}
                          </span>

                          <button
                            onClick={() => toggleActive("shop_products", product.id, product.is_active)}
                            style={css.pill(product.is_active)}
                          >
                            {product.is_active ? "Active" : "Hidden"}
                          </button>

                          <button
                            onClick={() => deleteRow("shop_products", product.id, product.name)}
                            style={css.btn("danger")}
                          >
                            Delete
                          </button>
                        </div>

                        {/* Variants (expanded) */}
                        {expanded && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1d26", display: "grid", gap: 6 }}>
                            {pvariants.length === 0 ? (
                              <p style={{ color: "#4a5060", fontSize: "0.78rem", margin: 0 }}>No variants.</p>
                            ) : pvariants.map(v => (
                              <div key={v.id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "6px 10px", borderRadius: 6,
                                background: "#080b12", flexWrap: "wrap",
                              }}>
                                <span style={{ flex: 1, color: "#c8d3f0", fontSize: "0.82rem", minWidth: 100 }}>{v.name}</span>

                                {/* Inline price editor */}
                                {editingPrice?.variantId === v.id ? (
                                  <form
                                    onSubmit={e => { e.preventDefault(); savePrice(v.id, editingPrice.value); }}
                                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                                  >
                                    <span style={{ color: "#4a5060", fontSize: "0.8rem" }}>$</span>
                                    <input
                                      autoFocus
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editingPrice.value}
                                      onChange={e => setEditingPrice({ variantId: v.id, value: e.target.value })}
                                      style={{
                                        width: 80, padding: "3px 7px", borderRadius: 5,
                                        border: "1px solid #3a4060", background: "#0d1117",
                                        color: "#eef3ff", fontSize: "0.82rem", outline: "none",
                                      }}
                                    />
                                    <button type="submit" style={css.btn("primary")}>Save</button>
                                    <button type="button" onClick={() => setEditingPrice(null)} style={css.btn()}>Cancel</button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => setEditingPrice({ variantId: v.id, value: String(v.price) })}
                                    style={{
                                      background: "none", border: "none", cursor: "pointer",
                                      color: "#62abff", fontSize: "0.82rem", fontWeight: 700,
                                      padding: "2px 6px", borderRadius: 4,
                                      textDecoration: "underline dotted",
                                    }}
                                    title="Click to edit price"
                                  >
                                    ${v.price.toFixed(2)}
                                  </button>
                                )}

                                <button
                                  onClick={() => toggleActive("shop_variants", v.id, v.is_active)}
                                  style={css.pill(v.is_active)}
                                >
                                  {v.is_active ? "Active" : "Hidden"}
                                </button>

                                <button
                                  onClick={() => deleteRow("shop_variants", v.id, v.name)}
                                  style={{ ...css.btn("danger"), padding: "3px 8px" }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p style={{ color: "#8e98ab", textAlign: "center", padding: 32 }}>
                No products match &ldquo;{search}&rdquo;
              </p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
