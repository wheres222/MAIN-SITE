/**
 * Discord alerting for high-severity security events.
 *
 * Throttling is the whole point of this module. A single `nuclei` run fires
 * thousands of requests in a minute; posting one message each would hit
 * Discord's webhook rate limit and bury the signal in its own noise, exactly
 * when you need to see it. Instead: one message per (ip, kind) per window, and
 * the next message for that pair reports how many hits were suppressed.
 */

const THROTTLE_WINDOW_MS = 15 * 60_000;

interface ThrottleState {
  firstSentAt: number;
  suppressed: number;
}

function throttleStore(): Map<string, ThrottleState> {
  const g = globalThis as typeof globalThis & {
    __securityAlertThrottle?: Map<string, ThrottleState>;
  };
  if (!g.__securityAlertThrottle) g.__securityAlertThrottle = new Map();
  return g.__securityAlertThrottle;
}

export interface SecurityAlert {
  kind: string;
  ip: string | null;
  path: string | null;
  detail: Record<string, unknown>;
}

const KIND_LABEL: Record<string, string> = {
  scanner_ua: "Scanner tool detected",
  scanner_path: "Scanner path probe",
  sqli_attempt: "SQL injection attempt",
  xss_attempt: "XSS attempt",
  traversal_attempt: "Path traversal attempt",
  auth_failure_burst: "Repeated failed logins",
  not_found_sweep: "404 sweep (path enumeration)",
  rate_limited: "Rate limit tripped",
  admin_denied: "Denied admin access attempt",
  preview_secret_failed: "Wrong maintenance preview secret",
};

/**
 * Returns the number of suppressed hits to report, or null when this alert
 * should stay silent.
 */
function shouldSend(key: string, now = Date.now()): number | null {
  const store = throttleStore();

  for (const [k, v] of store.entries()) {
    if (now - v.firstSentAt > THROTTLE_WINDOW_MS * 2) store.delete(k);
  }

  const existing = store.get(key);

  if (!existing || now - existing.firstSentAt > THROTTLE_WINDOW_MS) {
    store.set(key, { firstSentAt: now, suppressed: 0 });
    return 0;
  }

  existing.suppressed += 1;
  return null;
}

export async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  const webhookUrl = process.env.DISCORD_SECURITY_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const key = `${alert.ip ?? "unknown"}:${alert.kind}`;
  const state = throttleStore().get(key);
  const suppressedBefore = state?.suppressed ?? 0;

  if (shouldSend(key) === null) return;

  const label = KIND_LABEL[alert.kind] ?? alert.kind;
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "IP", value: `\`${alert.ip ?? "unknown"}\``, inline: true },
    { name: "Path", value: `\`${(alert.path ?? "-").slice(0, 200)}\``, inline: true },
  ];

  const matched = alert.detail?.matched;
  if (typeof matched === "string") {
    fields.push({ name: "Matched", value: `\`\`\`${matched.slice(0, 300)}\`\`\`` });
  }

  if (suppressedBefore > 0) {
    fields.push({
      name: "Suppressed since last alert",
      value: `${suppressedBefore} further hits were suppressed`,
    });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🚨 ${label}`,
            color: 0xff3b5c,
            fields,
            footer: { text: "cheatparadise.com · security" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[security] discord alert failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
