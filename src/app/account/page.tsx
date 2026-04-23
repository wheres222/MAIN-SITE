"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function AccountOverviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
  }, []);

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Account Overview</h1>
        <p className={styles.pageSub}>
          Welcome back{profile?.username ? `, ${profile.username}` : ""}
        </p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Balance</span>
          <span className={styles.statValue}>${(profile?.balance ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Orders</span>
          <span className={styles.statValueNeutral}>{orders.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Referral Earnings</span>
          <span className={styles.statValue}>${(profile?.total_earned ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Referral Code</span>
          <span className={`${styles.statValueNeutral} ${styles.statCode}`}>
            {profile?.referral_code || "—"}
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
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
