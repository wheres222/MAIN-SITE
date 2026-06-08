"use client";

import { useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import styles from "./dashboard-preview.module.css";

type Tab = "account" | "password" | "invoices" | "orders" | "balances" | "referrers";

const PROFILE = {
  username: "DemoUser",
  email: "demo@cheatparadise.com",
  balance: 42.5,
  referral_code: "DEMO1234",
  total_earned: 18.75,
};

const ORDERS = [
  { id: "CP-10293", product: "Rust Lite — 30 Days",     amount: 24.99, status: "completed", date: "Jun 1, 2026" },
  { id: "CP-10288", product: "Fortnite Full — 7 Days",  amount: 12.99, status: "completed", date: "May 28, 2026" },
  { id: "CP-10281", product: "CS2 Premium — 1 Day",     amount: 4.99,  status: "pending",   date: "May 27, 2026" },
];

const TRANSACTIONS = [
  { id: "t1", type: "Deposit",          amount: 50.0,   status: "completed", date: "May 20, 2026" },
  { id: "t2", type: "Purchase — Rust",  amount: -24.99, status: "completed", date: "Jun 1, 2026" },
  { id: "t3", type: "Referral payout",  amount: 3.75,   status: "completed", date: "May 30, 2026" },
  { id: "t4", type: "Cashout",          amount: -10.0,  status: "pending",   date: "May 25, 2026" },
];

const REFERRALS = [
  { user: "rustlord_22", joined: "May 10, 2026", earned: 6.25 },
  { user: "extractking", joined: "May 18, 2026", earned: 3.75 },
  { user: "fnt_sweat",   joined: "May 22, 2026", earned: 8.75 },
];

const TIERS = [
  { name: "Bronze", req: "0 referrals", kickback: "5%", active: true },
  { name: "Silver", req: "10 referrals", kickback: "8%", active: false },
  { name: "Gold",   req: "25 referrals", kickback: "12%", active: false },
];

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

const NAV: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "account",   label: "Account",   icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { id: "password",  label: "Password",  icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { id: "invoices",  label: "Invoices",  icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> },
  { id: "orders",    label: "Orders",    icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" /></svg> },
  { id: "balances",  label: "Balances",  icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v1.5M12 15.5V17M9.5 10a2.5 2.5 0 0 1 5 0c0 1.4-1 2-2.5 2s-2.5.6-2.5 2a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
  { id: "referrers", label: "Referrers", icon: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M16 3.13a4 4 0 0 1 0 7.75M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
];

function Badge({ status }: { status: string }) {
  const cls = status === "completed" || status === "paid" ? styles.badgeOk
    : status === "pending" ? styles.badgeWarn
    : status === "failed" ? styles.badgeBad : styles.badgeNeutral;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export function DashboardPreview() {
  const [tab, setTab] = useState<Tab>("account");
  const initials = PROFILE.username.slice(0, 2).toUpperCase();

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="none" />

      <div className={styles.wrap}>
        <div className={styles.previewNote}>Preview — sample data, no login required</div>

        <div className={styles.shell}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.userBlock}>
              <span className={styles.avatar}>{initials}</span>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{PROFILE.username}</span>
                <span className={styles.userEmail}>{PROFILE.email}</span>
              </div>
            </div>
            <nav className={styles.nav}>
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button type="button" className={`${styles.navItem} ${styles.navSignOut}`}>
                <span className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                Sign out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            {tab === "account" && (
              <>
                <div className={styles.head}>
                  <h1 className={styles.title}>Account Overview</h1>
                  <p className={styles.sub}>Welcome back, {PROFILE.username}</p>
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}><span className={styles.statLabel}>Balance</span><span className={styles.statMoney}>{money(PROFILE.balance)}</span></div>
                  <div className={styles.stat}><span className={styles.statLabel}>Total Orders</span><span className={styles.statVal}>{ORDERS.length}</span></div>
                  <div className={styles.stat}><span className={styles.statLabel}>Referral Earnings</span><span className={styles.statMoney}>{money(PROFILE.total_earned)}</span></div>
                  <div className={styles.stat}><span className={styles.statLabel}>Referral Code</span><span className={styles.statCode}>{PROFILE.referral_code}</span></div>
                </div>
                <div className="panel">
                  <header className="panel-header">Recent Orders</header>
                  <div className="panel-body">
                    <table className={styles.table}>
                      <thead><tr><th>Order</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {ORDERS.map((o) => (
                          <tr key={o.id}><td className={styles.mono}>{o.id}</td><td>{o.product}</td><td className={styles.money}>{money(o.amount)}</td><td><Badge status={o.status} /></td><td className={styles.dim}>{o.date}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tab === "password" && (
              <>
                <div className={styles.head}><h1 className={styles.title}>Password &amp; Profile</h1><p className={styles.sub}>Update your account details</p></div>
                <div className={styles.colWrap}>
                  <div className="panel">
                    <header className="panel-header">Profile</header>
                    <div className="panel-body">
                      <div className={styles.field}><label className={styles.label}>Username</label><input className={styles.input} defaultValue={PROFILE.username} /></div>
                      <div className={styles.field}><label className={styles.label}>Email</label><input className={styles.input} defaultValue={PROFILE.email} disabled /></div>
                      <button type="button" className="btn-primary">Save Profile</button>
                    </div>
                  </div>
                  <div className="panel">
                    <header className="panel-header">Change Password</header>
                    <div className="panel-body">
                      <div className={styles.field}><label className={styles.label}>Current password</label><input type="password" className={styles.input} placeholder="••••••••" /></div>
                      <div className={styles.field}><label className={styles.label}>New password</label><input type="password" className={styles.input} placeholder="••••••••" /></div>
                      <div className={styles.field}><label className={styles.label}>Confirm new password</label><input type="password" className={styles.input} placeholder="••••••••" /></div>
                      <button type="button" className="btn-primary">Update Password</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "invoices" && (
              <>
                <div className={styles.head}><h1 className={styles.title}>Invoices</h1><p className={styles.sub}>Download receipts for your purchases</p></div>
                <div className="panel">
                  <header className="panel-header">Invoices</header>
                  <div className="panel-body">
                    <table className={styles.table}>
                      <thead><tr><th>Invoice</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
                      <tbody>
                        {ORDERS.map((o) => (
                          <tr key={o.id}><td className={styles.mono}>{o.id}</td><td>{o.product}</td><td className={styles.money}>{money(o.amount)}</td><td><Badge status={o.status === "completed" ? "paid" : o.status} /></td><td className={styles.dim}>{o.date}</td><td><button type="button" className={styles.miniBtn}>Download</button></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tab === "orders" && (
              <>
                <div className={styles.head}><h1 className={styles.title}>Orders</h1><p className={styles.sub}>Your purchase history &amp; license keys</p></div>
                <div className="panel">
                  <header className="panel-header">All Orders</header>
                  <div className="panel-body">
                    <table className={styles.table}>
                      <thead><tr><th>Order</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
                      <tbody>
                        {ORDERS.map((o) => (
                          <tr key={o.id}><td className={styles.mono}>{o.id}</td><td>{o.product}</td><td className={styles.money}>{money(o.amount)}</td><td><Badge status={o.status} /></td><td className={styles.dim}>{o.date}</td><td><button type="button" className={styles.miniBtn}>View key</button></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tab === "balances" && (
              <>
                <div className={styles.head}><h1 className={styles.title}>Balance</h1><p className={styles.sub}>Deposit funds or cash out earnings</p></div>
                <div className={styles.balanceCard}>
                  <div><span className={styles.balanceLabel}>Current balance</span><div className={styles.balanceAmt}>{money(PROFILE.balance)}</div></div>
                  <div className={styles.balanceActions}>
                    <button type="button" className="btn-primary">Deposit</button>
                    <button type="button" className="btn-ghost">Cash out</button>
                  </div>
                </div>
                <div className="panel">
                  <header className="panel-header">Transactions</header>
                  <div className="panel-body">
                    <table className={styles.table}>
                      <thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {TRANSACTIONS.map((t) => (
                          <tr key={t.id}><td>{t.type}</td><td className={t.amount < 0 ? styles.dim : styles.money}>{money(t.amount)}</td><td><Badge status={t.status} /></td><td className={styles.dim}>{t.date}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tab === "referrers" && (
              <>
                <div className={styles.head}><h1 className={styles.title}>Affiliates</h1><p className={styles.sub}>Earn kickback for every referral</p></div>
                <div className={styles.refRow}>
                  <div className={styles.refCard}>
                    <span className={styles.statLabel}>Your referral code</span>
                    <div className={styles.refCode}>{PROFILE.referral_code}</div>
                  </div>
                  <div className={styles.refCard}>
                    <span className={styles.statLabel}>Total earned</span>
                    <div className={styles.statMoney} style={{ fontSize: "1.7rem" }}>{money(PROFILE.total_earned)}</div>
                  </div>
                </div>
                <div className={styles.linkRow}>
                  <input className={styles.input} readOnly value={`https://cheatparadise.com/?ref=${PROFILE.referral_code}`} />
                  <button type="button" className="btn-primary">Copy link</button>
                </div>
                <div className="panel">
                  <header className="panel-header">Your Referrals</header>
                  <div className="panel-body">
                    <table className={styles.table}>
                      <thead><tr><th>User</th><th>Joined</th><th>You earned</th></tr></thead>
                      <tbody>
                        {REFERRALS.map((r) => (
                          <tr key={r.user}><td>{r.user}</td><td className={styles.dim}>{r.joined}</td><td className={styles.money}>{money(r.earned)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="panel" style={{ marginTop: 14 }}>
                  <header className="panel-header">Kickback Tiers</header>
                  <div className="panel-body">
                    <div className={styles.tiers}>
                      {TIERS.map((t) => (
                        <div key={t.name} className={`${styles.tier} ${t.active ? styles.tierActive : ""}`}>
                          <span className={styles.tierName}>{t.name}</span>
                          <span className={styles.tierKick}>{t.kickback}</span>
                          <span className={styles.tierReq}>{t.req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
