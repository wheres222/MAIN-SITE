import type { Metadata } from "next";
import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import styles from "@/components/admin-panels.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

interface Counts {
  high24h: number;
  total7d: number;
  accounts: number;
  recent: {
    id: number;
    occurred_at: string;
    kind: string;
    severity: string;
    ip: string | null;
    path: string | null;
  }[];
}

/**
 * Read straight through the service-role client rather than fetching our own
 * API route — this is already a server component behind the same guard, so an
 * HTTP round trip back into ourselves would only add latency.
 */
async function loadCounts(): Promise<Counts | null> {
  try {
    const db = createAdminClient();
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [high, total, accounts, recent] = await Promise.all([
      db
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .eq("severity", "high")
        .gte("occurred_at", dayAgo),
      db
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .gte("occurred_at", weekAgo),
      db.from("profiles").select("id", { count: "exact", head: true }),
      db
        .from("security_events")
        .select("id, occurred_at, kind, severity, ip, path")
        .order("occurred_at", { ascending: false })
        .limit(8),
    ]);

    return {
      high24h: high.count ?? 0,
      total7d: total.count ?? 0,
      accounts: accounts.count ?? 0,
      recent: recent.data ?? [],
    };
  } catch {
    // Supabase not configured, or the migration has not been run yet.
    return null;
  }
}

function severityClass(severity: string): string {
  if (severity === "high") return styles.sevHigh;
  if (severity === "medium") return styles.sevMedium;
  return styles.sevLow;
}

export default async function AdminOverviewPage() {
  const viewer = await requireRole("staff");
  const isOwner = hasRole(viewer, "owner");
  const counts = isOwner ? await loadCounts() : null;

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>
          {isOwner
            ? "Site health at a glance. Security telemetry is recorded server-side, so it captures automated traffic that client-side analytics never sees."
            : "Staff tools. Product and status management are in the sidebar."}
        </p>
      </div>

      {isOwner && !counts && (
        <div className={styles.notice}>
          No telemetry yet. Run{" "}
          <code>supabase/migrations/roles_and_security.sql</code> in the Supabase
          SQL editor and confirm <code>SUPABASE_SERVICE_ROLE_KEY</code> is set.
        </div>
      )}

      {isOwner && counts && (
        <>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>High severity</span>
              <span
                className={`${styles.statValue} ${
                  counts.high24h > 0 ? styles.statValueDanger : ""
                }`}
              >
                {counts.high24h}
              </span>
              <span className={styles.statHint}>last 24 hours</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>All events</span>
              <span className={styles.statValue}>{counts.total7d}</span>
              <span className={styles.statHint}>last 7 days</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Accounts</span>
              <span className={styles.statValue}>{counts.accounts}</span>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Latest security events</h2>

            {counts.recent.length === 0 ? (
              <div className={styles.empty}>
                Nothing recorded yet. Events are only written when a request
                trips a signature, so an empty log means a quiet site.
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Severity</th>
                      <th>Kind</th>
                      <th>IP</th>
                      <th>Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.recent.map((event) => (
                      <tr key={event.id}>
                        <td>{new Date(event.occurred_at).toLocaleString()}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${severityClass(event.severity)}`}
                          >
                            {event.severity}
                          </span>
                        </td>
                        <td>{event.kind}</td>
                        <td className={styles.mono}>{event.ip ?? "—"}</td>
                        <td className={styles.mono}>{event.path ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ marginTop: 14, marginBottom: 0 }}>
              <Link href="/admin/security" className={styles.button}>
                Open full security log
              </Link>
            </p>
          </div>
        </>
      )}

      {!isOwner && (
        <div className={styles.notice}>
          You are signed in as staff. Security telemetry and user management are
          owner-only.
        </div>
      )}
    </>
  );
}
