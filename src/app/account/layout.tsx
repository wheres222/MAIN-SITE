"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import styles from "./layout.module.css";
import { usePreferences } from "@/components/preferences-provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * Order matters: items are rendered flat and a group heading is emitted
 * whenever `group` changes, so entries sharing a group must be adjacent. An
 * empty group renders no heading — the first run needs no label, it is simply
 * the top of the list.
 */
const NAV_ITEMS = [
  {
    href: "/account",
    exact: true,
    labelKey: "account.account",
    groupKey: "",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path fill="currentColor" d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm0 1.9c-4.4 0-8 2.6-8 5.4 0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5 0-2.8-3.6-5.4-8-5.4Z" />
      </svg>
    ),
  },
  {
    href: "/account/balance",
    exact: false,
    labelKey: "account.balances",
    groupKey: "account.billing",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path fill="currentColor" d="M12 3c-4.4 0-7.9 1.3-7.9 3S7.6 9 12 9s7.9-1.3 7.9-3S16.4 3 12 3Z" />
        <path fill="currentColor" d="M4.1 8.7v2.6c0 1.6 3.5 2.9 7.9 2.9s7.9-1.3 7.9-2.9V8.7C18.2 9.9 15.2 10.6 12 10.6s-6.2-.7-7.9-1.9Z" />
        <path fill="currentColor" d="M4.1 13.6v2.6c0 1.6 3.5 2.9 7.9 2.9s7.9-1.3 7.9-2.9v-2.6c-1.7 1.2-4.7 1.9-7.9 1.9s-6.2-.7-7.9-1.9Z" />
      </svg>
    ),
  },
  {
    href: "/account/deposit",
    exact: false,
    labelKey: "account.deposit",
    groupKey: "account.billing",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path fill="currentColor" d="M3 7.2A2.2 2.2 0 0 1 5.2 5h13.6A2.2 2.2 0 0 1 21 7.2V8H3v-.8Z" />
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M3 10.2h18v6.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 16.8v-6.6Zm8.2 2.1v1.8H9.4v1.6h1.8v1.8h1.6v-1.8h1.8v-1.6h-1.8v-1.8h-1.6Z" />
      </svg>
    ),
  },
  {
    href: "/account/invoices",
    exact: false,
    labelKey: "account.invoices",
    groupKey: "account.billing",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4.6h8v1.6H8V7.6Zm0 3.6h8v1.6H8v-1.6Zm0 3.6h5v1.6H8v-1.6Z" />
      </svg>
    ),
  },
  {
    href: "/account/orders",
    exact: false,
    labelKey: "account.orders",
    groupKey: "account.billing",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path d="M8.7 8.4V6.3a3.3 3.3 0 0 1 6.6 0v2.1" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        <path fill="currentColor" d="M5.3 7.4h13.4a1.1 1.1 0 0 1 1.1 1.2l-1 10.5A2.1 2.1 0 0 1 16.7 21H7.3a2.1 2.1 0 0 1-2.1-1.9l-1-10.5a1.1 1.1 0 0 1 1.1-1.2Z" />
      </svg>
    ),
  },
  {
    href: "/account/referrals",
    exact: false,
    labelKey: "account.referrers",
    groupKey: "account.affiliate",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path fill="currentColor" d="M9.2 11.9a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm0 1.7c-4 0-7.2 2.2-7.2 4.8 0 .8.6 1.4 1.4 1.4h11.6c.8 0 1.4-.6 1.4-1.4 0-2.6-3.2-4.8-7.2-4.8Z" />
        <path fill="currentColor" d="M17 11.4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm.5 1.6c-.5 0-1 .04-1.5.12 1.7 1.2 2.8 2.9 2.8 4.9 0 .3 0 .6-.1.9h2.9c.8 0 1.4-.6 1.4-1.4 0-2.5-2.5-4.5-5.5-4.5Z" />
      </svg>
    ),
  },
  {
    href: "/account/settings",
    exact: false,
    labelKey: "account.password",
    groupKey: "account.security",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.4 10.2h11.2a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H6.4a1.8 1.8 0 0 1-1.8-1.8V12a1.8 1.8 0 0 1 1.8-1.8Zm6.4 5.6a1.2 1.2 0 1 0-1.6 0v1.5a.8.8 0 0 0 1.6 0v-1.5Z" />
      </svg>
    ),
  },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();
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

      <div className={styles.wrapper}>
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
              {NAV_ITEMS.map((item, i) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                // A heading appears wherever the group changes. Fragments emit
                // no DOM node, so the links stay direct children of .nav and
                // its flex layout — including the mobile wrap — is unaffected.
                const startsGroup = item.groupKey && item.groupKey !== NAV_ITEMS[i - 1]?.groupKey;
                return (
                  <Fragment key={item.href}>
                    {startsGroup && (
                      <span className={styles.navGroupLabel}>{t(item.groupKey as TranslationKey)}</span>
                    )}
                    <Link
                      href={item.href}
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      {t(item.labelKey as TranslationKey)}
                    </Link>
                  </Fragment>
                );
              })}

              <span className={styles.navGroupLabel}>{t("nav.support")}</span>
              <Link href="/support" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path fill="currentColor" d="M5.2 3.5h13.6A2.2 2.2 0 0 1 21 5.7v8.6a2.2 2.2 0 0 1-2.2 2.2H8.9l-4 3.8a1 1 0 0 1-1.7-.8V5.7a2.2 2.2 0 0 1 2-2.2Z" />
      </svg>
                </span>
                {t("account.tickets")}
              </Link>

              {/* Shown only to staff and owners. This is convenience, not
                  security: the markup ships in the client bundle either way, so
                  hiding it reveals nothing on its own. requireRole() in
                  src/app/admin/layout.tsx is what actually refuses anyone who
                  follows the link without the role. */}
              {isStaff && (
                <Link href="/admin" className={styles.navItem}>
                  <span className={styles.navIcon}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path fill="currentColor" d="M3.5 3.5h6v9h-6v-9Zm11 0h6v5h-6v-5Zm0 7.5h6v9.5h-6V11Zm-11 4h6v5.5h-6V15Z" />
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
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path fill="currentColor" d="M4 5.3A2.3 2.3 0 0 1 6.3 3h4.6a1 1 0 1 1 0 2H6.3a.3.3 0 0 0-.3.3v13.4c0 .2.1.3.3.3h4.6a1 1 0 1 1 0 2H6.3A2.3 2.3 0 0 1 4 18.7V5.3Z" />
        <path fill="currentColor" d="m16.5 7.3 4.2 4a1 1 0 0 1 0 1.4l-4.2 4a1 1 0 0 1-1.4-1.4l2.4-2.3H10a1 1 0 1 1 0-2h7.5l-2.4-2.3a1 1 0 0 1 1.4-1.4Z" />
      </svg>
                </span>
                {t("auth.signOut")}
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            <div className={styles.contentInner}>{children}</div>
          </main>
        </div>
      </div>

      {showSignOutConfirm && (
        <ConfirmDialog
          title={t("auth.signOutConfirmTitle")}
          message={t("auth.signOutConfirmBody")}
          confirmLabel={t("auth.signOut")}
          cancelLabel={t("auth.staySignedIn")}
          destructive
          onConfirm={confirmSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </div>
  );
}
