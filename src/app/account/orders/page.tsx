"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../account.module.css";

interface Order {
  id: string;
  sellauth_order_id: string | null;
  product_name: string;
  product_variant: string | null;
  product_image: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const ROWS_OPTIONS = [10, 25, 50];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>My Orders</h1>
        <p className={styles.pageSub}>All purchases from Cheat Paradise</p>
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
          {search ? "No orders match your search." : "You haven't placed any orders yet."}
          {!search && <><br /><a href="/" className={styles.emptyBtn}>Browse Store</a></>}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Price</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className={styles.tdPrimary}>{order.product_name}</span>
                    {order.product_variant && (
                      <span className={styles.tdOrange} style={{ display: "block", fontSize: "0.76rem" }}>
                        {order.product_variant}
                      </span>
                    )}
                    <span className={styles.mono} style={{ display: "block", marginTop: 2 }}>
                      {order.sellauth_order_id || order.id}
                    </span>
                  </td>
                  <td className={styles.tdPrimary}>${order.amount.toFixed(1)}</td>
                  <td style={{ color: "#6b7280", fontSize: "0.78rem" }}>{formatDate(order.created_at)}</td>
                  <td>
                    <button type="button" className={styles.actionBtn}>View</button>
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
