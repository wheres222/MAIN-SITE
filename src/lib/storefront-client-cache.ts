import type { StorefrontData } from "@/types/sellauth";

const CLIENT_CACHE_TTL_MS = 90_000;

let cachedStorefront: StorefrontData | null = null;
let cachedAtMs = 0;
let inFlight: Promise<StorefrontData> | null = null;

function isCacheFresh(): boolean {
  return Boolean(cachedStorefront && Date.now() - cachedAtMs < CLIENT_CACHE_TTL_MS);
}

export function getCachedStorefront(): StorefrontData | null {
  return isCacheFresh() ? cachedStorefront : null;
}

export function primeStorefrontCache(data: StorefrontData) {
  cachedStorefront = data;
  cachedAtMs = Date.now();
}

export async function fetchStorefrontClient(options?: {
  force?: boolean;
}): Promise<StorefrontData> {
  const force = Boolean(options?.force);

  if (!force && isCacheFresh() && cachedStorefront) {
    return cachedStorefront;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const response = await fetch("/api/storefront", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load storefront (${response.status}).`);
    }

    const payload = (await response.json()) as StorefrontData;
    primeStorefrontCache(payload);
    return payload;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
