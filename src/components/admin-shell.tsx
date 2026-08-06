"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import styles from "./admin-shell.module.css";

type Role = "user" | "staff" | "owner";

interface NavItem {
  href: string;
  label: string;
  exact: boolean;
  minRole: Role;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    exact: true,
    minRole: "staff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/admin/traffic",
    label: "Traffic",
    exact: false,
    minRole: "staff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <path d="M4 17l5-5 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 8h5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/security",
    label: "Security",
    exact: false,
    minRole: "owner",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.5 12.2l1.8 1.8 3.4-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    exact: false,
    minRole: "owner",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 19c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 11.5a3 3 0 100-6M18 19c0-2.4-1-4.3-2.6-5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    exact: false,
    minRole: "staff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <path d="M4 8l8-4 8 4-8 4-8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M4 8v8l8 4 8-4V8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/status",
    label: "Status",
    exact: false,
    minRole: "staff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.6V12l2.8 2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const RANK: Record<Role, number> = { user: 0, staff: 1, owner: 2 };

export function AdminShell({
  role,
  email,
  children,
}: {
  role: Role;
  email: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();

  // The server guard is what actually enforces access — this filter only keeps
  // staff from seeing links that would bounce them.
  const visible = NAV.filter((item) => RANK[role] >= RANK[item.minRole]);

  return (
    <div className={styles.page}>
      <SiteHeader activeTab="none" />

      <div className={styles.wrapper}>
        <div className={styles.panel}>
          <aside className={styles.sidebar}>
            <div className={styles.identity}>
              <span className={styles.identityLabel}>Signed in as</span>
              <span className={styles.identityEmail} title={email ?? ""}>
                {email ?? "—"}
              </span>
              <span
                className={`${styles.roleBadge} ${
                  role === "owner" ? styles.roleOwner : styles.roleStaff
                }`}
              >
                {role}
              </span>
            </div>

            <nav className={styles.nav} aria-label="Admin">
              {visible.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                    {item.minRole === "owner" && (
                      <span className={styles.ownerTag}>OWNER</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className={styles.backLink}>
              <Link href="/" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
                    <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Back to site
              </Link>
            </div>
          </aside>

          <section className={styles.content}>{children}</section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
