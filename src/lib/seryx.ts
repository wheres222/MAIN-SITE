/**
 * SERYX reseller API — SERVER SIDE ONLY.
 *
 * Docs: https://seryx.gg/reseller/api-docs/
 * This module must never be imported from a client component. SERYX_API_KEY is
 * a prepaid wallet credential: anyone holding it can spend the balance.
 *
 * The API surface is a single endpoint — POST /keys/generate — which mints
 * licence keys and debits the reseller wallet. There is no stock endpoint and
 * no documented way to void a key once issued, which shapes two decisions here:
 *
 *   1. Every call carries an Idempotency-Key. A webhook that retries after a
 *      timeout must not charge the wallet twice for one paid order, and the
 *      server caches the response for 24h against that key.
 *   2. Quantity is batched into one call rather than looped per unit. The
 *      per-secret limit is 30 requests/minute, so a 10-key order looped one at
 *      a time burns a third of the minute's budget for no reason.
 */
import "server-only";
import { logger } from "@/lib/logger";

function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return "";
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

const SERYX_API_KEY = normalizeEnvSecret(process.env.SERYX_API_KEY);
const SERYX_BASE_URL =
  normalizeEnvSecret(process.env.SERYX_API_BASE) ||
  "https://api.seryx.gg/api/v1/reseller";

/** Seryx caps a single generate call at 50 keys. */
const MAX_KEYS_PER_CALL = 50;

export type SeryxGame = "fivem" | "rust";

export interface SeryxPlan {
  game: SeryxGame;
  /** Canonical SKU code sent as `planType`. */
  planType: string;
  /** Human label, matching Seryx's own naming. */
  label: string;
}

/**
 * The complete plan table from the docs. Kept here rather than fetched because
 * Seryx exposes no plan-listing endpoint — so this is the only place that knows
 * which (game, planType) pairs are real, and the delivery path validates
 * against it before spending money on a request that would 400.
 */
export const SERYX_PLANS: readonly SeryxPlan[] = [
  { game: "fivem", planType: "week",          label: "FiveM · 7 Days" },
  { game: "fivem", planType: "month",         label: "FiveM · 30 Days" },
  { game: "fivem", planType: "lifetime",      label: "FiveM · Lifetime" },
  { game: "rust",  planType: "rust_day",      label: "Rust · 1 Day" },
  { game: "rust",  planType: "rust_threeday", label: "Rust · 3 Days" },
  { game: "rust",  planType: "rust_month",    label: "Rust · 30 Days" },
  { game: "rust",  planType: "rust_lifetime", label: "Rust · Lifetime" },
] as const;

export function isSeryxConfigured(): boolean {
  return Boolean(SERYX_API_KEY);
}

/** Resolves a (game, planType) pair to a known plan, or null if it is not one. */
export function findSeryxPlan(
  game: string | null | undefined,
  planType: string | null | undefined
): SeryxPlan | null {
  if (!game || !planType) return null;
  return (
    SERYX_PLANS.find((p) => p.game === game && p.planType === planType) ?? null
  );
}

export interface SeryxKeyResult {
  success: boolean;
  message: string;
  keys: string[];
  /** Wallet figures from the last successful call, for logging/alerting. */
  charged?: number;
  newBalance?: number;
  /** True when the failure is worth alerting on rather than just retrying. */
  outOfBalance?: boolean;
}

interface SeryxGenerateResponse {
  ok?: boolean;
  keys?: unknown;
  charged?: unknown;
  newBalance?: unknown;
  error?: unknown;
  message?: unknown;
  required?: unknown;
  available?: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Idempotency keys must be 8–80 chars of [A-Za-z0-9_-.]. Order-item UUIDs
 * already qualify, but anything else the caller passes might not, so strip and
 * pad rather than letting Seryx reject the request with a 400.
 */
function safeIdempotencyKey(raw: string, suffix: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_\-.]/g, "").slice(0, 60);
  const base = cleaned.length >= 8 ? cleaned : `cp${cleaned}`.padEnd(8, "0");
  return `${base}.${suffix}`.slice(0, 80);
}

/**
 * One call to /keys/generate, with retries for the transient statuses the docs
 * call out. The same idempotency key is reused across retries on purpose —
 * that is what makes a retry safe rather than a second charge.
 */
async function generateChunk(
  game: SeryxGame,
  planType: string,
  quantity: number,
  idempotencyKey: string
): Promise<SeryxKeyResult> {
  const MAX_ATTEMPTS = 4;
  let lastMessage = "Seryx request failed.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${SERYX_BASE_URL}/keys/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERYX_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ planType, game, quantity }),
      });
    } catch (err) {
      // Network fault. Safe to retry: either Seryx never saw the request, or it
      // did and the idempotency key will return the cached result.
      lastMessage = `Seryx network error: ${String(err).slice(0, 160)}`;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 1000);
        continue;
      }
      return { success: false, message: lastMessage, keys: [] };
    }

    const json = (await response
      .json()
      .catch(() => ({}))) as SeryxGenerateResponse;

    if (response.ok) {
      const keys = Array.isArray(json.keys)
        ? json.keys.filter((k): k is string => typeof k === "string")
        : [];

      if (keys.length === 0) {
        return {
          success: false,
          message: "Seryx returned 200 with no keys.",
          keys: [],
        };
      }

      return {
        success: true,
        message: "Keys generated.",
        keys,
        charged: typeof json.charged === "number" ? json.charged : undefined,
        newBalance:
          typeof json.newBalance === "number" ? json.newBalance : undefined,
      };
    }

    // Insufficient wallet balance. Retrying cannot help — someone has to top up
    // — so fail immediately and flag it for the caller to alert on.
    if (response.status === 402) {
      const required = typeof json.required === "number" ? json.required : "?";
      const available =
        typeof json.available === "number" ? json.available : "?";
      return {
        success: false,
        outOfBalance: true,
        message: `Seryx wallet has insufficient balance (need €${required}, have €${available}).`,
        keys: [],
      };
    }

    // Permanent failures — a retry would produce the same answer.
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      const detail =
        typeof json.error === "string"
          ? json.error
          : typeof json.message === "string"
          ? json.message
          : "";
      return {
        success: false,
        message: `Seryx returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`,
        keys: [],
      };
    }

    // 409 replay-in-progress, 429 rate limited, 5xx — all worth another go.
    lastMessage = `Seryx returned ${response.status}`;
    if (attempt < MAX_ATTEMPTS) {
      // 409 wants a short pause; the rest get exponential backoff.
      const waitMs = response.status === 409 ? 1500 : attempt * 1500;
      await sleep(waitMs);
      continue;
    }
  }

  return { success: false, message: lastMessage, keys: [] };
}

/**
 * Mint `quantity` keys for a plan, batching across calls when the order is
 * larger than Seryx allows in one request.
 *
 * `idempotencySeed` must be stable for a given order line — the order item id
 * is ideal. Chunks derive distinct keys from it so a partially-completed batch
 * resumes correctly instead of replaying the first chunk.
 */
export async function generateSeryxKeys(params: {
  game: SeryxGame;
  planType: string;
  quantity: number;
  idempotencySeed: string;
}): Promise<SeryxKeyResult> {
  const { game, planType, quantity, idempotencySeed } = params;

  if (!SERYX_API_KEY) {
    return { success: false, message: "SERYX_API_KEY is not configured.", keys: [] };
  }

  if (!findSeryxPlan(game, planType)) {
    return {
      success: false,
      message: `Unknown Seryx plan "${game}/${planType}".`,
      keys: [],
    };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { success: false, message: `Invalid quantity ${quantity}.`, keys: [] };
  }

  const keys: string[] = [];
  let charged = 0;
  let newBalance: number | undefined;

  for (let offset = 0, chunk = 0; offset < quantity; offset += MAX_KEYS_PER_CALL, chunk++) {
    const size = Math.min(MAX_KEYS_PER_CALL, quantity - offset);
    const result = await generateChunk(
      game,
      planType,
      size,
      safeIdempotencyKey(idempotencySeed, String(chunk))
    );

    if (!result.success) {
      // Return what was already minted. Those keys are paid for and must reach
      // the customer even though the rest of the line failed — throwing them
      // away would charge the wallet for keys nobody ever receives.
      return {
        success: false,
        message: result.message,
        keys,
        charged,
        newBalance,
        outOfBalance: result.outOfBalance,
      };
    }

    keys.push(...result.keys);
    charged += result.charged ?? 0;
    newBalance = result.newBalance ?? newBalance;
  }

  if (typeof newBalance === "number") {
    logger.info("Seryx keys generated", {
      game,
      planType,
      quantity,
      charged,
      newBalance,
    });
  }

  return { success: true, message: "Keys generated.", keys, charged, newBalance };
}
