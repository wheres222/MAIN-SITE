"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin-panels.module.css";

interface SecurityEvent {
  id: number;
  occurred_at: string;
  kind: string;
  severity: "low" | "medium" | "high";
  ip: string | null;
  country: string | null;
  user_agent: string | null;
  method: string | null;
  path: string | null;
  query: string | null;
  status_code: number | null;
  detail: Record<string, unknown> | null;
}

interface Summary {
  days: number;
  total: number;
  byKind: Record<string, number>;
  bySeverity: Record<string, number>;
  topIps: { ip: string; count: number }[];
}

const KIND_LABEL: Record<string, string> = {
  scanner_path: "Scanner path probe",
  scanner_ua: "Scanner tool",
  sqli_attempt: "SQL injection",
  xss_attempt: "XSS attempt",
  traversal_attempt: "Path traversal",
  admin_access: "Admin access",
  admin_denied: "Admin denied",
  preview_secret_failed: "Bad preview secret",
  auth_failure: "Failed login",
  auth_failure_burst: "Login burst",
  rate_limited: "Rate limited",
  not_found_sweep: "404 sweep",
};

function severityClass(severity: string): string {
  if (severity === "high") return styles.sevHigh;
  if (severity === "medium") return styles.sevMedium;
  return styles.sevLow;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AdminSecurityPanel() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [days, setDays] = useState(7);
  const [severity, setSeverity] = useState("");
  const [kind, setKind] = useState("");
  const [ip, setIp] = useState("");

  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [busyIp, setBusyIp] = useState("");

  const loadBlocks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      if (!res.ok) return;
      const json = (await res.json()) as { blocks: { ip: string }[] };
      setBlockedIps(new Set(json.blocks.map((b) => b.ip)));
    } catch {
      // Non-fatal: the log is still readable without block state.
    }
  }, []);

  /**
   * Blocking asks for a reason. It is the field that makes the decision
   * reviewable later, and an unexplained block is one nobody dares undo.
   */
  async function toggleBlock(target: string, currentlyBlocked: boolean) {
    let reason: string | null = "";
    if (!currentlyBlocked) {
      reason = window.prompt(
        `Block ${target}?\n\nSupport and policy pages stay reachable so a wrongly blocked customer can still contact you.\n\nReason:`,
        "Automated scanning"
      );
      if (reason === null) return;
    }

    setBusyIp(target);
    setError("");
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          currentlyBlocked
            ? { action: "unblock-ip", ip: target }
            : { action: "block-ip", ip: target, reason }
        ),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not change the block.");
        return;
      }
      setBlockedIps((prev) => {
        const next = new Set(prev);
        if (currentlyBlocked) next.delete(target);
        else next.add(target);
        return next;
      });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyIp("");
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (severity) params.set("severity", severity);
      if (kind) params.set("kind", kind);
      if (ip.trim()) params.set("ip", ip.trim());

      const res = await fetch(`/api/admin/events?${params}`);
      if (!res.ok) {
        setError(
          res.status === 404
            ? "This page is owner-only."
            : `Request failed (${res.status}).`
        );
        return;
      }
      const json = (await res.json()) as { events: SecurityEvent[]; summary: Summary };
      setEvents(json.events);
      setSummary(json.summary);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [days, severity, kind, ip]);

  useEffect(() => {
    void load();
    void loadBlocks();
  }, [load, loadBlocks]);

  const high = summary?.bySeverity.high ?? 0;

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Security</h1>
        <p className={styles.subtitle}>
          Server-side request telemetry — scanners, injection attempts, path
          enumeration and abuse. Unlike the traffic page this sees bots and
          tooling, because it is recorded before any JavaScript runs.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Events</span>
          <span className={styles.statValue}>{summary?.total ?? "—"}</span>
          <span className={styles.statHint}>last {days} days</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>High severity</span>
          <span className={`${styles.statValue} ${high > 0 ? styles.statValueDanger : ""}`}>
            {summary ? high : "—"}
          </span>
          <span className={styles.statHint}>alerted to Discord</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Medium</span>
          <span className={styles.statValue}>{summary?.bySeverity.medium ?? "—"}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Distinct IPs</span>
          <span className={styles.statValue}>{summary?.topIps.length ?? "—"}</span>
          <span className={styles.statHint}>top 10 shown below</span>
        </div>
      </div>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time window"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>

        <select
          className={styles.select}
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          aria-label="Severity"
        >
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className={styles.select}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          aria-label="Event kind"
        >
          <option value="">All kinds</option>
          {Object.entries(KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          placeholder="Filter by IP"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          aria-label="Filter by IP"
        />

        <button className={styles.button} onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {summary && summary.topIps.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Most active sources</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Events</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {summary.topIps.map((row) => {
                  const blocked = blockedIps.has(row.ip);
                  return (
                    <tr key={row.ip}>
                      <td className={styles.mono}>
                        {row.ip}
                        {blocked && (
                          <span className={`${styles.badge} ${styles.sevHigh}`} style={{ marginLeft: 8 }}>
                            blocked
                          </span>
                        )}
                      </td>
                      <td>{row.count}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className={styles.button} onClick={() => setIp(row.ip)}>
                          Inspect
                        </button>
                        <button
                          className={styles.button}
                          disabled={busyIp === row.ip}
                          onClick={() => void toggleBlock(row.ip, blocked)}
                        >
                          {busyIp === row.ip ? "…" : blocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Event log</h2>

        {loading && <div className={styles.loading}>Loading events…</div>}

        {!loading && events.length === 0 && (
          <div className={styles.empty}>
            No events match these filters. On a quiet site that is the expected
            result — events are only written when something trips a signature.
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Severity</th>
                  <th>Kind</th>
                  <th>IP</th>
                  <th>Path</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td title={event.occurred_at}>{timeAgo(event.occurred_at)}</td>
                    <td>
                      <span className={`${styles.badge} ${severityClass(event.severity)}`}>
                        {event.severity}
                      </span>
                    </td>
                    <td>{KIND_LABEL[event.kind] ?? event.kind}</td>
                    <td className={styles.mono}>
                      {event.ip ?? "—"}
                      {event.country ? ` (${event.country})` : ""}
                    </td>
                    <td className={styles.mono}>{event.path ?? "—"}</td>
                    <td className={styles.mono}>
                      {typeof event.detail?.matched === "string"
                        ? event.detail.matched
                        : JSON.stringify(event.detail ?? {}).slice(0, 120)}
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
