/* eslint-disable @typescript-eslint/no-require-imports */

function buildUrl(baseUrl, path, query) {
  const root = (baseUrl || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${root}${suffix}`);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function authHeaders(mode, key) {
  const token = String(key || "").trim();
  if (!token) return {};

  switch ((mode || "bearer").toLowerCase()) {
    case "bearer":
      return { Authorization: `Bearer ${token}` };
    case "x-api-key":
    case "xapi":
      return { "x-api-key": token };
    case "apikey":
      return { apikey: token };
    case "authorization":
      return { Authorization: token };
    default:
      return { Authorization: `Bearer ${token}` };
  }
}

async function checkDesyncApi({ logger }) {
  const baseUrl = process.env.DESYNC_API_BASE_URL?.trim() || "https://api.reselling.pro";
  const apiPath = process.env.DESYNC_HEALTH_PATH?.trim() || "/api/apikeys/seller";
  const authMode = process.env.DESYNC_AUTH_MODE?.trim() || "bearer";
  const apiKey = process.env.DESYNC_API_KEY?.trim() || "";

  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      message: "DESYNC_API_KEY is missing",
      url: buildUrl(baseUrl, apiPath),
      authMode,
    };
  }

  const query = authMode === "query" ? { api_key: apiKey } : undefined;
  const url = buildUrl(baseUrl, apiPath, query);

  const headers = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    ...(authMode === "query" ? {} : authHeaders(authMode, apiKey)),
  };

  logger?.info?.("desync-api check request", { url, authMode });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const text = await response.text();
    const bodyPreview = (text || "").slice(0, 600);

    return {
      ok: response.ok,
      status: response.status,
      url,
      authMode,
      bodyPreview,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      authMode,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

module.exports = { checkDesyncApi };
