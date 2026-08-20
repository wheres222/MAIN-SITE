"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AFFILIATE_TIERS } from "@/lib/affiliate-program";
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

// Shared with the public /affiliates pages. A duplicated table here would drift
// the moment rates changed, and a recruitment page advertising a rate this
// dashboard does not pay is worse than no recruitment page at all.
const TIERS = AFFILIATE_TIERS;

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
  const [copiedValue, setCopiedValue] = useState("");
  const [cashingOut, setCashingOut] = useState(false);
  const [cashoutNotice, setCashoutNotice] = useState({ text: "", type: "" });

  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
  const code = profile?.referral_code || "";

  /**
   * Every form of the link that actually works, so nobody has to build one.
   *
   * All of these credit you. proxy.ts stores ?ref= in a 30-day cookie on
   * whatever page it arrives at, and the signup form reads the parameter first
   * and the cookie second — so a link to the homepage or to a category page
   * still attributes the signup that happens twenty minutes later.
   */
  const referralLinks = code
    ? [
        `${siteUrl}/register?ref=${code}`,
        `${siteUrl}/?ref=${code}`,
        `${siteUrl}/categories/rust?ref=${code}`,
      ]
    : [];


  /** Copy any link row, tracking which one so the button can confirm it. */
  function copyValue(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(""), 2000);
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
        <h1 className={styles.pageTitle}>My Referrers</h1>
        <p className={styles.pageSub}>
          Earn credit every time someone you invited makes a purchase.
        </p>
      </div>

      {/* The explainer. Someone landing here for the first time needs to know
          what the code does before any number on this page means anything. */}
      <section className={styles.refExplain}>
        <h2 className={styles.refExplainTitle}>How the referral system works</h2>
        <p className={styles.refExplainBody}>
          Earn free site credit from the people you invite with your referral code.
          Whenever someone you invited makes a purchase, you receive a percentage of
          what they spend.
        </p>
        <p className={styles.refExplainAccent}>
          This applies to every purchase they make, not only their first.
        </p>
        <p className={styles.refExplainAccent}>
          Credit buys keys and accounts, or can be withdrawn by crypto or PayPal by
          opening a support ticket.
        </p>
        <a className={styles.refCta} href="/support">
          Open a ticket to apply for a % increase
        </a>
      </section>

      {/* Four figures, in the order people actually ask them: what rate am I on,
          how many people, how much, how many payouts. */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Percentage</span>
          <span className={styles.statValueNeutral}>{currentTier.kickback}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Users</span>
          <span className={styles.statValueNeutral}>{referrals.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Earning</span>
          <span className={styles.statValue}>${(profile?.total_earned ?? 0).toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Earning count</span>
          <span className={styles.statValueNeutral}>{referrals.length}</span>
        </div>
      </div>

      {/* Every usable form of the link, so nobody has to construct one. Each row
          copies on click — the reference layout lists them as bare text, which
          leaves you selecting a URL by hand. */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M11 6.5 12.8 4.7a3.8 3.8 0 0 1 5.4 5.4L16.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M13 17.5l-1.8 1.8a3.8 3.8 0 0 1-5.4-5.4L7.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Referrer link</h2>
        </div>
        <p className={styles.refLinkHint}>Any of these work. Click one to copy it.</p>
        <ul className={styles.refLinkList}>
          {referralLinks.map((link) => (
            <li key={link}>
              <button type="button" className={styles.refLinkRow} onClick={() => copyValue(link)}>
                <span className={styles.refLinkText}>{link}</span>
                <span className={styles.refLinkCopy}>
                  {copiedValue === link ? "Copied" : "Copy"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Cash out stays: it is the only place the affiliate balance can be
          claimed, and the reference layout has no equivalent. */}
      <div className={styles.affiliateBalanceCard}>
        <div className={styles.affiliateBalanceInfo}>
          <span className={styles.affiliateBalanceTitle}>Affiliate balance</span>
          <span className={styles.affiliateBalanceSub}>
            Cash out your affiliate balance. Minimum cash out is $1.00.
          </span>
          {cashoutNotice.text && (
            <p
              className={cashoutNotice.type === "error" ? styles.error : styles.success}
              style={{ marginTop: 8, marginBottom: 0 }}
            >
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

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17 14.6c2.4.7 4 2.8 4 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Users</h2>
        </div>
        {referrals.length === 0 ? (
          <p className={styles.refEmpty}>No referred users yet</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${r.status}` as keyof typeof styles]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v1.4M12 15.6V17M9.7 9.8a2.3 2.3 0 0 1 4.6 0c0 1.3-.9 1.8-2.3 1.8s-2.3.5-2.3 1.8a2.3 2.3 0 0 0 4.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Earnings</h2>
        </div>
        {referrals.length === 0 ? (
          <p className={styles.refEmpty}>No transactions from users yet</p>
        ) : (
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
                    <td>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className={styles.tdGreen}>${r.commission_amount.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${r.status}` as keyof typeof styles]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><rect x="5" y="12" width="4" height="5" stroke="currentColor" strokeWidth="1.7" /><rect x="10" y="8" width="4" height="9" stroke="currentColor" strokeWidth="1.7" /><rect x="15" y="4" width="4" height="13" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Affiliate tiers</h2>
        </div>
        <div className={styles.tierList}>
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`${styles.tierRow} ${tier.name === currentTier.name ? styles.tierRowActive : ""}`}
            >
              <span>
                <span className={styles.tierName}>{tier.name}</span>
                <span className={styles.tierKickback}>({tier.kickback} kickback)</span>
              </span>
              <span className={styles.tierReq}>${tier.threshold.toFixed(2)} total deposited</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}