"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import styles from "./account-modal.module.css";

interface AccountModalProps {
  onClose: () => void;
}

type Section = "overview" | "settings" | "invoices" | "orders" | "balance" | "referrals";

interface Profile {
  username: string | null;
  balance: number;
  referral_code: string;
  total_earned: number;
}

interface Order {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

/**
 * The dashboard as a single popup. Sidebar switches between sections via
 * internal state (no route changes). Sign-out routes through the
 * ConfirmDialog so users don't accidentally log themselves out.
 */
export function AccountModal({ onClose }: AccountModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [section, setSection] = useState<Section>("overview");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email || "");
      setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);

      const [{ data: prof }, { data: ords }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("orders")
          .select("id, product_name, amount, currency, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const name =
        prof?.username ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      setDisplayName(name);
      setProfile(prof);
      setOrders(ords || []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showSignOutConfirm) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, showSignOutConfirm]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  async function doSignOut() {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  }

  const initials = displayName.slice(0, 2).toUpperCase() || "??";

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Account",   icon: <IconAccount /> },
    { id: "settings",  label: "Password",  icon: <IconLock /> },
    { id: "invoices",  label: "Invoices",  icon: <IconDoc /> },
    { id: "orders",    label: "Orders",    icon: <IconBag /> },
    { id: "balance",   label: "Balances",  icon: <IconWallet /> },
    { id: "referrals", label: "Referrers", icon: <IconUsers /> },
  ];

  return (
    <>
      <div
        ref={overlayRef}
        className={styles.overlay}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        <div className={styles.modal}>
          {/* Close button */}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dashboard"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

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
                <span className={styles.userName}>{displayName || "—"}</span>
                <span className={styles.userEmail}>{email || "Not signed in"}</span>
              </div>
            </div>

            <nav className={styles.nav}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ""}`}
                  onClick={() => setSection(item.id)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                className={`${styles.navItem} ${styles.navSignOut}`}
                onClick={() => setShowSignOutConfirm(true)}
              >
                <span className={styles.navIcon}><IconSignOut /></span>
                Sign out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            {loading ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : section === "overview" ? (
              <OverviewSection profile={profile} orders={orders} displayName={displayName} />
            ) : (
              <SectionRedirect section={section} onClose={onClose} />
            )}
          </main>
        </div>
      </div>

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign back in to access your account, orders, and balance."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={doSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Section: Account Overview ───────────────────────────────────────────────
function OverviewSection({
  profile,
  orders,
  displayName,
}: {
  profile: Profile | null;
  orders: Order[];
  displayName: string;
}) {
  return (
    <>
      <header className={styles.pageHead}>
        <h2 id="account-modal-title" className={styles.pageTitle}>Account Overview</h2>
        <p className={styles.pageSub}>
          Welcome back{displayName ? `, ${displayName}` : ""}
        </p>
      </header>

      <div className={styles.statsRow}>
        <StatCard label="Balance"            value={`$${(profile?.balance ?? 0).toFixed(2)}`} accent />
        <StatCard label="Total Orders"        value={String(orders.length)} />
        <StatCard label="Referral Earnings"   value={`$${(profile?.total_earned ?? 0).toFixed(2)}`} accent />
        <StatCard label="Referral Code"       value={profile?.referral_code || "—"} mono />
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 className={styles.panelTitle}>Recent Orders</h3>
          <Link href="/account/orders" className={styles.seeAll}>View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            No orders yet.
            <br />
            <Link href="/" className={styles.emptyBtn}>Browse Store</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <div className={styles.orderLeft}>
                  <span className={styles.orderName}>{order.product_name}</span>
                  <span className={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderAmt}>
                    ${order.amount.toFixed(2)} {order.currency}
                  </span>
                  <span className={`${styles.badge} ${styles[`badge_${order.status}`] || ""}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className={styles.quickGrid}>
        <Link href="/account/balance" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Balance Logs</span>
          <span className={styles.quickCardDesc}>View transactions &amp; withdraw</span>
        </Link>
        <Link href="/account/referrals" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Affiliates</span>
          <span className={styles.quickCardDesc}>Earn kickback from referrals</span>
        </Link>
        <Link href="/account/settings" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Settings</span>
          <span className={styles.quickCardDesc}>Change password &amp; profile</span>
        </Link>
      </div>
    </>
  );
}

// ─── Section: bounce out to full-page route for complex sub-sections ─────────
function SectionRedirect({ section, onClose }: { section: Section; onClose: () => void }) {
  const labels: Record<Section, { title: string; href: string; sub: string }> = {
    overview:  { title: "Account",   href: "/account",           sub: "" },
    settings:  { title: "Password",  href: "/account/settings",  sub: "Change your password and account credentials." },
    invoices:  { title: "Invoices",  href: "/account/invoices",  sub: "Browse and download your purchase invoices." },
    orders:    { title: "Orders",    href: "/account/orders",    sub: "Full order history with search and pagination." },
    balance:   { title: "Balances",  href: "/account/balance",   sub: "View balance transactions and request withdrawals." },
    referrals: { title: "Referrers", href: "/account/referrals", sub: "Your referral code, commissions, and tier status." },
  };
  const info = labels[section];

  return (
    <>
      <header className={styles.pageHead}>
        <h2 className={styles.pageTitle}>{info.title}</h2>
        <p className={styles.pageSub}>{info.sub}</p>
      </header>

      <div className={styles.panel} style={{ textAlign: "center", padding: "40px 24px" }}>
        <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
          Open the full {info.title.toLowerCase()} page for the complete view.
        </p>
        <Link
          href={info.href}
          className={styles.primaryBtn}
          onClick={onClose}
        >
          Open {info.title}
        </Link>
      </div>
    </>
  );
}

// ─── Small bits ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, accent, mono,
}: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${accent ? styles.statValueAccent : ""} ${mono ? styles.statValueMono : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconAccount() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v1.5M12 15.5V17M9.5 10a2.5 2.5 0 0 1 5 0c0 1.4-1 2-2.5 2s-2.5.6-2.5 2a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
