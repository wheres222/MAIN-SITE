"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin-panels.module.css";

type Role = "user" | "staff" | "owner";

interface AdminUser {
  id: string;
  username: string | null;
  email: string | null;
  role: Role;
  balance: number | null;
  createdAt: string;
  lastSignInAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUsersPanel({ viewerId }: { viewerId: string | null }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        setError(
          res.status === 404
            ? "This page is owner-only."
            : `Request failed (${res.status}).`
        );
        return;
      }
      const json = (await res.json()) as { users: AdminUser[] };
      setUsers(json.users);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(userId: string, role: Role) {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not change that role.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const staffCount = users.filter((u) => u.role !== "user").length;

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <p className={styles.subtitle}>
          Grant staff access here. Staff can manage products and order status and
          look up orders for support; owners additionally see security telemetry,
          this page, and bulk data export.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Accounts</span>
          <span className={styles.statValue}>{users.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Staff &amp; owners</span>
          <span className={styles.statValue}>{staffCount}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.input}
          placeholder="Search email or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
        <button className={styles.button} onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className={styles.card}>
        {loading && <div className={styles.loading}>Loading users…</div>}

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>No accounts match that search.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Joined</th>
                  <th>Last sign-in</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isSelf = user.id === viewerId;
                  return (
                    <tr key={user.id}>
                      <td className={styles.mono}>{user.email ?? "—"}</td>
                      <td>{user.username ?? "—"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastSignInAt)}</td>
                      <td>
                        <select
                          className={styles.select}
                          value={user.role}
                          disabled={isSelf || saving[user.id]}
                          title={
                            isSelf
                              ? "You cannot change your own role"
                              : undefined
                          }
                          onChange={(e) =>
                            void changeRole(user.id, e.target.value as Role)
                          }
                        >
                          <option value="user">user</option>
                          <option value="staff">staff</option>
                          <option value="owner">owner</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
