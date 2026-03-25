"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontSize: "0.82rem",
        color: "rgba(255,255,255,0.45)",
        padding: "14px 0 0",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap",
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {i > 0 && (
              <span aria-hidden="true" style={{ opacity: 0.4 }}>
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
