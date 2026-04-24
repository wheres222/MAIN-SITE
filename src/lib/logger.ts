/**
 * Structured JSON logger for server-side API routes.
 * Outputs JSON in production, pretty-prints in development.
 * Set SENTRY_DSN to also forward errors to Sentry.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

const IS_PROD = process.env.NODE_ENV === "production";

function write(level: LogLevel, msg: string, ctx?: Record<string, unknown>): void {
  const entry: LogEntry = { level, msg, ts: new Date().toISOString(), ...ctx };

  if (IS_PROD) {
    // JSON lines — parseable by log aggregators (Cloudflare Logs, Datadog, etc.)
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    method(`[${level.toUpperCase()}] ${msg}`, ctx ?? "");
  }

  // Forward errors to Sentry if configured
  if (level === "error" && process.env.SENTRY_DSN) {
    reportToSentry(msg, ctx).catch(() => undefined);
  }
}

async function reportToSentry(msg: string, ctx?: Record<string, unknown>): Promise<void> {
  const dsn = process.env.SENTRY_DSN!;
  // Minimal Sentry envelope — no SDK needed
  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    level: "error",
    message: msg,
    extra: ctx,
    platform: "node",
  };

  const { protocol, host, pathname } = new URL(dsn);
  const [publicKey] = (new URL(dsn).username ?? "").split(":");
  const projectId = pathname.replace("/", "");
  const endpoint = `${protocol}//${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;

  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => write("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
};
