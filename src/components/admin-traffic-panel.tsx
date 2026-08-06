"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin-panels.module.css";

interface Analytics {
  configured: boolean;
  message?: string;
  error?: string;
  days?: number;
  pageviews?: number;
  visitors?: number;
  daily?: { day: string; pageviews: number; visitors: number }[];
  topPages?: { path: string; views: number }[];
  topReferrers?: { source: string; views: number }[];
}

export function AdminTrafficPanel() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      setData((await res.json()) as Analytics);
    } catch {
      setData({ configured: true, error: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const daily = data?.daily ?? [];
  const peak = Math.max(1, ...daily.map((d) => d.visitors));

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Traffic</h1>
        <p className={styles.subtitle}>
          Visitor numbers from PostHog. These count people with JavaScript
          enabled — bots, scrapers and scanners do not appear here. For those,
          see the Security page.
        </p>
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
        <button className={styles.button} onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading && <div className={styles.loading}>Loading analytics…</div>}

      {!loading && data && !data.configured && (
        <div className={styles.notice}>
          {data.message} You can create a personal API key in PostHog under
          Settings → Personal API keys, with read access to Query.
        </div>
      )}

      {!loading && data?.error && (
        <div className={styles.error}>PostHog query failed: {data.error}</div>
      )}

      {!loading && data?.configured && !data.error && (
        <>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Visitors</span>
              <span className={styles.statValue}>
                {(data.visitors ?? 0).toLocaleString()}
              </span>
              <span className={styles.statHint}>unique, last {days} days</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Pageviews</span>
              <span className={styles.statValue}>
                {(data.pageviews ?? 0).toLocaleString()}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Views per visitor</span>
              <span className={styles.statValue}>
                {data.visitors
                  ? ((data.pageviews ?? 0) / data.visitors).toFixed(1)
                  : "—"}
              </span>
            </div>
          </div>

          {daily.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Visitors per day</h2>
              <div className={styles.bars}>
                {daily.map((d) => (
                  <div
                    key={d.day}
                    className={styles.bar}
                    style={{ height: `${(d.visitors / peak) * 100}%` }}
                    title={`${d.day}: ${d.visitors} visitors, ${d.pageviews} views`}
                  />
                ))}
              </div>
              <div className={styles.barLabels}>
                <span>{daily[0]?.day}</span>
                <span>{daily[daily.length - 1]?.day}</span>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top pages</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topPages ?? []).map((row) => (
                    <tr key={row.path}>
                      <td className={styles.mono}>{row.path || "/"}</td>
                      <td>{row.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top referrers</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topReferrers ?? []).map((row) => (
                    <tr key={row.source}>
                      <td className={styles.mono}>{row.source}</td>
                      <td>{row.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
