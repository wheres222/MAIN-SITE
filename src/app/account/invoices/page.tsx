"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../account.module.css";

interface Order {
  id: string;
  sellauth_order_id: string | null;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const ROWS_OPTIONS = [10, 25, 50];

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (process.env.NODE_ENV !== "production") {
          setOrders([
            { id: "ord_demo_001", sellauth_order_id: "SA-58291", product_name: "Rust External (1 Month)",    amount: 19.99, currency: "USD", status: "completed", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
            { id: "ord_demo_002", sellauth_order_id: "SA-58144", product_name: "ARC Raiders ESP (Lifetime)", amount: 89.99, currency: "USD", status: "completed", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
            { id: "ord_demo_003", sellauth_order_id: "SA-57988", product_name: "HWID Spoofer (Permanent)",   amount: 24.99, currency: "USD", status: "pending",   created_at: new Date(Date.now() - 9 * 86400000).toISOString() },
            { id: "ord_demo_004", sellauth_order_id: "SA-57820", product_name: "R6 Siege Internal (1 Week)", amount: 12.50, currency: "USD", status: "completed", created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
          ]);
        }
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        !q ||
        o.product_name.toLowerCase().includes(q) ||
        (o.sellauth_order_id || "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleRows(v: number) { setRowsPerPage(v); setPage(1); }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    }) + " at " + new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function downloadInvoice(order: Order) {
    const invoiceId = `CP-${(order.sellauth_order_id || order.id.slice(0, 8)).toUpperCase()}`;
    const lines = [
      "CHEAT PARADISE — INVOICE",
      "========================",
      `Invoice #: ${invoiceId}`,
      `Date: ${new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      "",
      "ITEM",
      `  ${order.product_name}`,
      "",
      `TOTAL: $${order.amount.toFixed(2)} ${order.currency}`,
      `STATUS: ${order.status}`,
      "",
      "Thank you for your purchase — Cheat Paradise",
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>My Invoices</h1>
        <p className={styles.pageSub}>If your invoice is pending or processing payment, you can check its status with the check button.</p>
      </div>

      <input
        className={styles.searchBar}
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className={styles.paginationRow}>
        <button className={styles.paginationBtn} disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <button className={styles.paginationBtn} disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        <span className={styles.paginationInfo}>Page: {currentPage} | {totalPages} &nbsp;&nbsp; Total: {filtered.length}</span>
        <select
          className={styles.rowsSelect}
          value={rowsPerPage}
          onChange={(e) => handleRows(Number(e.target.value))}
        >
          {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className={styles.empty}>
          {search ? "No invoices match your search." : "No invoices found."}
          {!search && <><br /><a href="/" className={styles.emptyBtn}>Browse Store</a></>}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID | Date</th>
                <th>Method | Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className={styles.mono}>
                      {order.sellauth_order_id || order.id}
                    </span>
                    <span className={styles.tdSub}>{formatDate(order.created_at)}</span>
                  </td>
                  <td>
                    <span className={styles.tdPrimary}>{order.product_name} — ${order.amount.toFixed(0)}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${order.status.replace(/ /g, "_")}` as keyof typeof styles]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => downloadInvoice(order)}
                    >
                      Check
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
