"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../account.module.css";

interface Profile {
  referral_code: string;
  total_earned: number;
  balance: number;
}

interface Referral {
  id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const TIERS = [
  { name: "Tier 1", kickback: "1%",   threshold: 0 },
  { name: "Tier 2", kickback: "1.5%", threshold: 100 },
  { name: "Tier 3", kickback: "2%",   threshold: 1000 },
  { name: "Tier 4", kickback: "2.5%", threshold: 2500 },
  { name: "Tier 5", kickback: "3%",   threshold: 5000 },
];

function getTier(totalEarned: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (totalEarned >= t.threshold) tier = t;
  }
  return tier;
}

export default function ReferralsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [cashoutNotice, setCashoutNotice] = useState({ text: "", type: "" });

  const supabase = createClient();

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        setProfile({ referral_code: "PREVIEW42", total_earned: 187.25, balance: 42.5 });
        setReferrals([
          { id: "ref_demo_001", commission_amount: 4.99,  status: "paid",     created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
          { id: "ref_demo_002", commission_amount: 12.99, status: "paid",     created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
          { id: "ref_demo_003", commission_amount: 3.50,  status: "pending",  created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
          { id: "ref_demo_004", commission_amount: 19.99, status: "paid",     created_at: new Date(Date.now() - 18 * 86400000).toISOString() },
          { id: "ref_demo_005", commission_amount: 7.25,  status: "paid",     created_at: new Date(Date.now() - 31 * 86400000).toISOString() },
        ]);
      }
      setLoading(false);
      return;
    }

    const [{ data: prof }, { data: refs }] = await Promise.all([
      supabase.from("profiles").select("referral_code, total_earned, balance").eq("id", user.id).single(),
      supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProfile(prof);
    setReferrals(refs || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${siteUrl}/register?ref=${profile?.referral_code || ""}`;

  function copyCode() {
    if (!profile?.referral_code) return;
    navigator.clipboard.writeText(profile.referral_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  async function handleCashout() {
    setCashoutNotice({ text: "", type: "" });
    const pendingAmt = referrals.filter((r) => r.status === "pending").reduce((s, r) => s + r.commission_amount, 0);
    if (pendingAmt < 1) {
      setCashoutNotice({ text: "Minimum cashout is $1.00.", type: "error" });
      return;
    }
    setCashingOut(true);
    try {
      const res = await fetch("/api/account/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pendingAmt, method: "affiliate_balance", address: "affiliate_transfer" }),
      });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        setCashoutNotice({ text: data.error || "Request failed.", type: "error" });
        return;
      }
      setCashoutNotice({ text: "Cashout requested successfully!", type: "success" });
      await load();
    } finally {
      setCashingOut(false);
    }
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  const pendingEarnings = referrals.filter((r) => r.status === "pending").reduce((s, r) => s + r.commission_amount, 0);
  const currentTier = getTier(profile?.total_earned ?? 0);

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Affiliates</h1>
        <p className={styles.pageSub}>
          Invite others and earn a kickback every time they make a purchase under your code.
          Level up your tier and earn up to 3% kickback from each order!
        </p>
      </div>

      <div className={styles.statsRow} style={{ marginBottom: 20 }}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Current Tier</span>
          <span className={styles.statValue}>{currentTier.name}</span>
          <span style={{ fontSize: "0.72rem", color: "#4ade80", marginTop: -2 }}>{currentTier.kickback} kickback</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Deposited</span>
          <span className={styles.statValue}>${(profile?.total_earned ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Current Users</span>
          <span className={styles.statValue}>{referrals.length}</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Share your referral link</h2>
        </div>
        <p className={styles.notice}>
          Users will automatically be prompted to claim your code when they click this link.
        </p>
        <div className={styles.linkRow}>
          <input type="text" readOnly value={referralLink} className={styles.linkInput} />
          <button type="button" className={styles.copyLinkBtn} onClick={copyLink}>
            {copiedLink ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className={styles.refBlock}>
        <div>
          <span className={styles.refCodeLabel}>Your Referral Code</span>
          <span className={styles.refCode}>{profile?.referral_code || "—"}</span>
        </div>
        <button type="button" className={styles.copyBtn} onClick={copyCode}>
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Copy Code
            </>
          )}
        </button>
      </div>

      <div className={styles.affiliateBalanceCard}>
        <div className={styles.affiliateBalanceInfo}>
          <span className={styles.affiliateBalanceTitle}>Affiliate balance</span>
          <span className={styles.affiliateBalanceSub}>
            Cash out your affiliate balance. Minimum cash out is $1.00.
          </span>
          {cashoutNotice.text && (
            <p className={cashoutNotice.type === "error" ? styles.error : styles.success} style={{ marginTop: 8, marginBottom: 0 }}>
              {cashoutNotice.text}
            </p>
          )}
        </div>
        <div className={styles.affiliateBalanceRight}>
          <span className={styles.affiliateBalanceAmt}>${pendingEarnings.toFixed(2)}</span>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleCashout}
            disabled={cashingOut || pendingEarnings < 1}
          >
            {cashingOut ? "..." : "Cash Out"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 10px", fontSize: "0.8rem", color: "#6b7280" }}>
        <span>Total earned from referrals</span>
        <span style={{ color: "#4ade80", fontWeight: 600 }}>${(profile?.total_earned ?? 0).toFixed(2)}</span>
      </div>

      {referrals.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Referral History</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className={styles.tdGreen}>${r.commission_amount.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${r.status}` as keyof typeof styles]}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} style={{ color: "#fb923c" }}>Affiliate Tiers</h2>
        </div>
        <div className={styles.tierList}>
          {TIERS.map((tier) => {
            const isActive = tier.name === currentTier.name;
            const nextTier = TIERS[TIERS.indexOf(tier) + 1];
            return (
              <div key={tier.name} className={`${styles.tierRow} ${isActive ? styles.tierRowActive : ""}`}>
                <span>
                  <span className={styles.tierName}>{tier.name}</span>
                  <span className={styles.tierKickback}>({tier.kickback} kickback)</span>
                </span>
                <span className={styles.tierReq}>
                  {nextTier
                    ? `$${tier.threshold.toFixed(2)} total deposited`
                    : `$${tier.threshold.toFixed(2)} total deposited`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
