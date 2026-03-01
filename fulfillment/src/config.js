/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readConfig() {
  const root = process.cwd();

  return {
    host: process.env.FULFILLMENT_HOST || "127.0.0.1",
    port: toInt(process.env.FULFILLMENT_PORT, 8788),
    pollMs: toInt(process.env.FULFILLMENT_POLL_MS, 1500),
    concurrency: toInt(process.env.FULFILLMENT_CONCURRENCY, 1),
    maxAttempts: toInt(process.env.FULFILLMENT_MAX_ATTEMPTS, 3),
    adminToken: process.env.FULFILLMENT_ADMIN_TOKEN || "",
    webhookSecret: process.env.FULFILLMENT_WEBHOOK_SECRET || "",
    notifyUrl: process.env.FULFILLMENT_NOTIFY_URL || "",
    notifyToken: process.env.FULFILLMENT_NOTIFY_TOKEN || "",
    stateFile:
      process.env.FULFILLMENT_STATE_FILE ||
      path.join(root, "fulfillment", "state", "state.json"),
    artifactsDir:
      process.env.FULFILLMENT_ARTIFACTS_DIR ||
      path.join(root, "fulfillment", "artifacts"),
    mappingFile:
      process.env.FULFILLMENT_MAPPING_FILE ||
      path.join(root, "fulfillment", "config", "providers.json"),
  };
}

module.exports = { readConfig };
