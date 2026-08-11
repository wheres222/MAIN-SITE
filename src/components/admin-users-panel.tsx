"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin-panels.module.css";

type Role = "user" | "staff" | "owner";
type AccountStatus = "active" | "suspended" | "banned";

interface AdminUser {
  id: string;
  username: string | null;
  email: string | null;
  role: Role;
  status?: AccountStatus;
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

  async function changeStatus(userId: string, status: AccountStatus) {
    if (status !== "active") {
      const note = window.prompt(
        status === "banned"
          ? "Ban this account? They will be signed out and refused at login.\n\nReason (kept on the account):"
          : "Suspend this account? They keep order history and support, but cannot check out.\n\nReason:",
        ""
      );
      if (note === null) return;
      void applyStatus(userId, status, note);
      return;
    }
    void applyStatus(userId, status, "");
  }

  async function applyStatus(userId: string, status: AccountStatus, note: string) {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    setError("");
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-status", userId, status, note }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not change that status.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
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
                  <th>Status</th>
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
                      <td>
                        {/* Status is separate from role on purpose: role is what
                            they may do, status is whether they may do anything.
                            Suspended keeps order history and support reachable,
                            which is what makes it usable while investigating. */}
                        <select
                          className={styles.select}
                          value={user.status ?? "active"}
                          disabled={isSelf || saving[user.id]}
                          title={
                            isSelf ? "You cannot moderate your own account" : undefined
                          }
                          onChange={(e) =>
                            void changeStatus(user.id, e.target.value as AccountStatus)
                          }
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended — no checkout</option>
                          <option value="banned">banned — no sign-in</option>
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
