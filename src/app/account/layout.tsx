"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  {
    href: "/account",
    exact: true,
    label: "Account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/account/settings",
    exact: false,
    label: "Password",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/account/invoices",
    exact: false,
    label: "Invoices",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/account/orders",
    exact: false,
    label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/account/balance",
    exact: false,
    label: "Balances",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7v1.5M12 15.5V17M9.5 10a2.5 2.5 0 0 1 5 0c0 1.4-1 2-2.5 2s-2.5.6-2.5 2a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/account/deposit",
    exact: false,
    label: "Deposit",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 10v6M9 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/account/referrals",
    exact: false,
    label: "Referrers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");
      setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

      const name =
        profile?.username ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      setDisplayName(name);
      const role = (profile as { role?: string } | null)?.role;
      setIsStaff(role === "staff" || role === "owner");
    }
    load();
  }, [pathname, supabase]);

  function requestSignOut() {
    setShowSignOutConfirm(true);
  }

  async function confirmSignOut() {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = displayName.slice(0, 2).toUpperCase() || "??";

  return (
    <div className={styles.page}>
      <SiteHeader activeTab="none" />

      <div className={styles.wrapper} style={{ paddingTop: 96 }}>
        <div className={styles.panel}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.userBlock}>
              <div className={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarInitials}>{initials}</span>
                )}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userEmail}>{email}</span>
              </div>
            </div>

            <nav className={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}

              {/* Shown only to staff and owners. This is convenience, not
                  security: the markup ships in the client bundle either way, so
                  hiding it reveals nothing on its own. requireRole() in
                  src/app/admin/layout.tsx is what actually refuses anyone who
                  follows the link without the role. */}
              {isStaff && (
                <Link href="/admin" className={styles.navItem}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
                      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                      <rect x="14" y="11" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                      <rect x="3" y="15" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={requestSignOut}
                className={`${styles.navItem} ${styles.navSignOut}`}
              >
                <span className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Sign out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className={styles.content}>{children}</main>
        </div>
      </div>

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign back in to access your account, orders, and balance."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={confirmSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </div>
  );
}
