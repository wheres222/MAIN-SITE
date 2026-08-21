"use client";
/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./account.module.css";

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

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AccountOverviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState("");
  const [lastSignIn, setLastSignIn] = useState("");
  const [loading, setLoading] = useState(true);
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
      setCreatedAt(user.created_at || "");
      setLastSignIn(user.last_sign_in_at || "");

      const [{ data: prof }, { data: ords }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setProfile(prof);
      setOrders(ords || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  const displayName = profile?.username || email.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.pageSub}>Your profile, balance, and recent activity.</p>
      </div>

      {/* Identity band, then the facts about the account as label/value rows.
          These are read-only on purpose: everything editable lives behind an
          explicit action on the Password page. */}
      <div className={styles.profileCard}>
        <div className={styles.profileBanner}>
          <div className={styles.profileAvatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className={styles.profileAvatarImg} />
            ) : (
              <span className={styles.profileInitials}>{initials}</span>
            )}
          </div>
          <div className={styles.profileMeta}>
            <span className={styles.profileName}>{displayName}</span>
            <span className={styles.profileHint}>Member since {formatDate(createdAt)}</span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Username</span>
          <span className={styles.infoValue}>{displayName}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{email || "—"}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Last login</span>
          <span className={`${styles.infoValue} ${styles.infoValueMuted}`}>
            {formatDate(lastSignIn)}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Referral code</span>
          <span className={`${styles.infoValue} ${styles.infoValueMono}`}>
            {profile?.referral_code || "—"}
          </span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Balance</span>
          <span className={styles.statValue}>${(profile?.balance ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Recent orders</span>
          <span className={styles.statValueNeutral}>{orders.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Referral earnings</span>
          <span className={styles.statValue}>${(profile?.total_earned ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Referral code</span>
          <span className={`${styles.statValueNeutral} ${styles.statCode}`}>
            {profile?.referral_code || "—"}
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Recent orders</h2>
          <Link href="/account/orders" className={styles.seeAll}>View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <span>No orders yet.</span>
            <Link href="/" className={styles.emptyBtn}>Browse store</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <div className={styles.orderLeft}>
                  <span className={styles.orderName}>{order.product_name}</span>
                  <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderAmt}>
                    ${order.amount.toFixed(2)} {order.currency}
                  </span>
                  <span className={`${styles.badge} ${styles[`badge_${order.status}` as keyof typeof styles]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.quickGrid}>
        <Link href="/account/balance" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Balance logs</span>
          <span className={styles.quickCardDesc}>View transactions &amp; withdraw</span>
        </Link>
        <Link href="/account/referrals" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Affiliates</span>
          <span className={styles.quickCardDesc}>Earn kickback from referrals</span>
        </Link>
        <Link href="/account/settings" className={styles.quickCard}>
          <span className={styles.quickCardTitle}>Security</span>
          <span className={styles.quickCardDesc}>Change your password</span>
        </Link>
      </div>
    </>
  );
}
