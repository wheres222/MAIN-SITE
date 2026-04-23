"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../account.module.css";

interface CashoutRequest {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

const ROWS_OPTIONS = [10, 25, 50];

export default function BalancePage() {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [cashouts, setCashouts] = useState<CashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("crypto_btc");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const supabase = createClient();

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: prof }, { data: co }] = await Promise.all([
      supabase.from("profiles").select("balance, total_earned").eq("id", user.id).single(),
      supabase.from("cashout_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setBalance(Number(prof?.balance ?? 0));
    setTotalEarned(Number(prof?.total_earned ?? 0));
    setCashouts(co || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCashout(e: React.FormEvent) {
    e.preventDefault();
    setNotice({ text: "", type: "" });

    const parsedAmount = parseFloat(amount);
    if (!address.trim()) {
      setNotice({ text: "Enter a valid wallet address.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, method, address }),
      });

      const data = await res.json() as { error?: string; message?: string };

      if (!res.ok) {
        setNotice({ text: data.error || "Request failed.", type: "error" });
        return;
      }

      setNotice({ text: data.message || "Withdrawal request submitted!", type: "success" });
      setAmount("");
      setAddress("");
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cashouts.filter(
      (c) => !q || c.method.includes(q) || c.status.includes(q) || c.id.includes(q)
    );
  }, [cashouts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    }) + " at " + new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Balance Logs</h1>
        <p className={styles.pageSub}>Your current balance and withdrawal history</p>
      </div>

      <div className={styles.balanceDisplay}>
        <div>
          <span className={styles.balanceLabel}>Available Balance</span>
          <span className={styles.balanceAmt}>${balance.toFixed(2)}</span>
        </div>
        <span className={styles.balanceCurrency}>USD</span>
        {totalEarned > 0 && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <span className={styles.balanceLabel}>Total Earned</span>
            <span style={{ fontSize: "0.96rem", fontWeight: 700, color: "#4ade80" }}>
              ${totalEarned.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => setShowForm((v) => !v)}
          disabled={balance <= 0}
        >
          {showForm ? "Cancel" : "Request Withdrawal"}
        </button>
        {balance <= 0 && (
          <span style={{ marginLeft: 12, fontSize: "0.76rem", color: "#374151" }}>
            No balance available to withdraw.
          </span>
        )}
      </div>

      {showForm && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Withdraw Funds</h2>
          </div>
          <p className={styles.notice}>
            Minimum $1.00. Reviewed manually within 24–48 hours.
          </p>
          <form onSubmit={handleCashout} className={styles.form}>
            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Amount (USD)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className={styles.input}
                  placeholder={`Max $${balance.toFixed(2)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Withdrawal Method</label>
                <select className={styles.input} value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="crypto_btc">Bitcoin (BTC)</option>
                  <option value="crypto_eth">Ethereum (ETH)</option>
                  <option value="crypto_ltc">Litecoin (LTC)</option>
                  <option value="crypto_usdt">USDT (TRC-20)</option>
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Wallet Address</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Your crypto wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            {notice.text && (
              <p className={notice.type === "error" ? styles.error : styles.success}>
                {notice.text}
              </p>
            )}
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Withdrawal History</h2>
        </div>

        <input
          className={styles.searchBar}
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        <div className={styles.paginationRow}>
          <button className={styles.paginationBtn} disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <button className={styles.paginationBtn} disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          <span className={styles.paginationInfo}>Page: {currentPage} | {totalPages} &nbsp;&nbsp; Total: {filtered.length}</span>
          <select className={styles.rowsSelect} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
            {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>

        {cashouts.length === 0 ? (
          <div className={styles.empty}>No withdrawal requests yet.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID | Date</th>
                  <th>Type &amp; Info</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className={styles.mono}>{c.id}</span>
                      <span className={styles.tdSub}>{formatDate(c.created_at)}</span>
                    </td>
                    <td>
                      <span className={styles.tdPrimary}>withdrawal</span>
                      <span className={styles.tdBlue} style={{ display: "block", fontSize: "0.76rem" }}>
                        {c.method.replace("crypto_", "").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={styles.tdPrimary}>${c.amount.toFixed(2)}</span>
                      <span style={{ display: "block", marginTop: 3 }}>
                        <span className={`${styles.badge} ${styles[`badge_${c.status}` as keyof typeof styles]}`}>{c.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
