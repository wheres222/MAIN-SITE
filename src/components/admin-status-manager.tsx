"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { fetchStorefrontClient } from "@/lib/storefront-client-cache";
import type { SellAuthProduct } from "@/types/sellauth";

type StatusKind = "undetected" | "updating" | "detected";

interface StatusOverride {
  product_id: string;
  status: StatusKind;
  updated_at: string;
}

const STATUS_CONFIG: Record<
  StatusKind,
  { label: string; color: string; border: string; bg: string }
> = {
  undetected: {
    label: "Undetected",
    color: "#2fe496",
    border: "rgba(31,124,80,0.5)",
    bg: "rgba(18,67,45,0.85)",
  },
  updating: {
    label: "Updating",
    color: "#62abff",
    border: "rgba(44,105,196,0.5)",
    bg: "rgba(21,54,102,0.85)",
  },
  detected: {
    label: "Detected",
    color: "#ff8a9f",
    border: "rgba(179,64,94,0.5)",
    bg: "rgba(92,24,41,0.85)",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminStatusManager() {
  const [products, setProducts] = useState<SellAuthProduct[]>([]);
  const [overrides, setOverrides] = useState<Record<string, StatusOverride>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, "ok" | "err">>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStorefrontClient(),
      fetch("/api/product-statuses").then((r) => r.json()),
    ]).then(([storefront, rows]) => {
      setProducts(storefront.products ?? []);
      const map: Record<string, StatusOverride> = {};
      if (Array.isArray(rows)) {
        rows.forEach((r: StatusOverride) => {
          map[r.product_id] = r;
        });
      }
      setOverrides(map);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  async function setStatus(product: SellAuthProduct, status: StatusKind) {
    const id = String(product.id);
    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/product-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: id,
          product_name: product.name,
          status,
        }),
      });
      if (res.ok) {
        setOverrides((prev) => ({
          ...prev,
          [id]: {
            product_id: id,
            status,
            updated_at: new Date().toISOString(),
          },
        }));
        setFeedback((prev) => ({ ...prev, [id]: "ok" }));
        setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 1500);
      } else {
        setFeedback((prev) => ({ ...prev, [id]: "err" }));
        setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 2000);
      }
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function clearOverride(product: SellAuthProduct) {
    const id = String(product.id);
    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`/api/admin/product-statuses?product_id=${id}`, {
        method: "DELETE",
      });
      setOverrides((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <main className="shell subpage-wrap" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              color: "#f1f5ff",
              fontSize: "1.45rem",
              fontWeight: 800,
              margin: "0 0 6px",
            }}
          >
            Status Manager
          </h1>
          <p style={{ color: "#8e98ab", fontSize: "0.875rem", margin: 0 }}>
            Changes go live instantly on the status page for all visitors.
            {overrideCount > 0 && (
              <span style={{ color: "#62abff", marginLeft: 8 }}>
                {overrideCount} active override
                {overrideCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* API Docs */}
        <details
          style={{
            marginBottom: 28,
            background: "#0d1017",
            border: "1px solid #1e2332",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <summary
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 18px",
              cursor: "pointer",
              color: "#c8d4f0",
              fontWeight: 600,
              fontSize: "0.9rem",
              listStyle: "none",
              userSelect: "none",
            }}
          >
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(0,166,255,0.12)",
              border: "1px solid rgba(0,166,255,0.2)",
              color: "#00A6FF",
              fontSize: "0.78rem",
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {"</>"}
            </span>
            Update via API
            <span style={{ color: "#4a5468", fontWeight: 400, fontSize: "0.82rem", marginLeft: 4 }}>
              Push status from your bots/monitors
            </span>
          </summary>

          <div style={{ padding: "0 18px 18px", borderTop: "1px solid #1e2332" }}>
            <p style={{ color: "#8e98ab", fontSize: "0.85rem", margin: "14px 0 10px" }}>
              Use your <code style={{ color: "#00A6FF", background: "rgba(0,166,255,0.08)", padding: "1px 6px", borderRadius: 4 }}>STATUS_API_KEY</code> env variable to push status updates programmatically.
              The <code style={{ color: "#c8d4f0" }}>:ref</code> is any slug you choose — it becomes the identifier in the status board.
            </p>

            {/* Endpoint table */}
            <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
              {[
                { method: "PUT", path: "/api/status/:ref", desc: "Set or update status" },
                { method: "DELETE", path: "/api/status/:ref", desc: "Clear override (revert to auto)" },
                { method: "GET", path: "/api/status/:ref", desc: "Read current status (no auth)" },
              ].map(({ method, path, desc }) => (
                <div key={method + path} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 12px",
                  background: "#111520",
                  borderRadius: 6,
                  border: "1px solid #1e2332",
                  fontSize: "0.82rem",
                }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    color: method === "PUT" ? "#62abff" : method === "DELETE" ? "#ff8a9f" : "#2fe496",
                    letterSpacing: "0.04em",
                    width: 44,
                    flexShrink: 0,
                  }}>{method}</span>
                  <code style={{ color: "#c8d4f0", flex: 1 }}>{path}</code>
                  <span style={{ color: "#4a5468", fontSize: "0.78rem" }}>{desc}</span>
                </div>
              ))}
            </div>

            {/* Curl example */}
            <pre style={{
              margin: 0,
              padding: "14px 16px",
              background: "#080b11",
              border: "1px solid #1a2030",
              borderRadius: 8,
              fontSize: "0.78rem",
              color: "#8aa4c8",
              overflowX: "auto",
              lineHeight: 1.7,
              fontFamily: "monospace",
            }}>
{`# Set a product to UPDATING
curl -X PUT https://cheatparadise.gg/api/status/rust \\
  -H "Authorization: Bearer $STATUS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"updating","message":"Patch dropped — testing in progress"}'

# Valid status values: undetected | updating | detected
# :ref examples:  rust  valorant  cs2  fortnite  apex`}
            </pre>

            {/* Status values */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {(Object.entries(STATUS_CONFIG) as [StatusKind, typeof STATUS_CONFIG[StatusKind]][]).map(([kind, cfg]) => (
                <span key={kind} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 5,
                  border: `1px solid ${cfg.border}`,
                  background: cfg.bg,
                  color: cfg.color,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  fontFamily: "monospace",
                }}>
                  {`"${kind}"`}
                </span>
              ))}
            </div>
          </div>
        </details>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {(Object.entries(STATUS_CONFIG) as [StatusKind, typeof STATUS_CONFIG[StatusKind]][]).map(
            ([kind, cfg]) => (
              <span
                key={kind}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${cfg.border}`,
                  background: cfg.bg,
                  color: cfg.color,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "currentColor",
                    boxShadow: "0 0 6px currentColor",
                  }}
                />
                {cfg.label.toUpperCase()}
              </span>
            )
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #2a2d36",
              background: "transparent",
              color: "#8e98ab",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            Auto = inferred from product name
          </span>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #2a2d36",
            background: "#0f1117",
            color: "#eef3ff",
            fontSize: "0.9rem",
            marginBottom: 12,
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Product list */}
        {loading ? (
          <p style={{ color: "#8e98ab", padding: "24px 0" }}>
            Loading products…
          </p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {filtered.map((product) => {
              const id = String(product.id);
              const override = overrides[id];
              const isSaving = Boolean(saving[id]);
              const fb = feedback[id];

              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: override ? "#12161f" : "#0d1017",
                    border: `1px solid ${override ? "#252d42" : "#1a1d26"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    gap: 12,
                    flexWrap: "wrap",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                >
                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <span
                      style={{
                        color: "#eef3ff",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      {product.name}
                    </span>
                    {override ? (
                      <span
                        style={{
                          display: "block",
                          color: STATUS_CONFIG[override.status].color,
                          fontSize: "0.7rem",
                          marginTop: 2,
                          opacity: 0.85,
                        }}
                      >
                        {STATUS_CONFIG[override.status].label} · set {fmt(override.updated_at)}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "block",
                          color: "#4a5060",
                          fontSize: "0.7rem",
                          marginTop: 2,
                        }}
                      >
                        Auto-inferred
                      </span>
                    )}
                  </div>

                  {/* Controls */}
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      flexShrink: 0,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {fb === "ok" && (
                      <span style={{ color: "#2fe496", fontSize: "0.75rem", fontWeight: 700, marginRight: 4 }}>
                        ✓ Saved
                      </span>
                    )}
                    {fb === "err" && (
                      <span style={{ color: "#ff8a9f", fontSize: "0.75rem", fontWeight: 700, marginRight: 4 }}>
                        ✗ Error
                      </span>
                    )}

                    {(
                      ["undetected", "updating", "detected"] as StatusKind[]
                    ).map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      const isActive = override?.status === s;
                      return (
                        <button
                          key={s}
                          disabled={isSaving}
                          onClick={() => setStatus(product, s)}
                          style={{
                            padding: "5px 11px",
                            borderRadius: 6,
                            cursor: "pointer",
                            border: `1px solid ${cfg.border}`,
                            background: isActive ? cfg.bg : "transparent",
                            color: cfg.color,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            opacity: isSaving ? 0.5 : 1,
                            transition: "background 0.15s, opacity 0.15s",
                            outline: isActive
                              ? `1px solid ${cfg.color}44`
                              : "none",
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}

                    <button
                      disabled={isSaving || !override}
                      onClick={() => clearOverride(product)}
                      title="Revert to auto-inferred status"
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        cursor: override && !isSaving ? "pointer" : "default",
                        border: "1px solid #2a2d36",
                        background: "transparent",
                        color: "#8e98ab",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        opacity: isSaving || !override ? 0.3 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      Auto
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p
                style={{
                  color: "#8e98ab",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
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
