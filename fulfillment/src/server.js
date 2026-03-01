/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const path = require("path");
const fs = require("fs");
const { readConfig } = require("./config");
const { createLogger } = require("./logger");
const { StateStore } = require("./state-store");
const { MappingRegistry } = require("./mappings");
const { Processor } = require("./processor");
const { parseWebhook } = require("./webhook-parser");
const { adapters } = require("./adapters");
const { readBody, json, notFound, badRequest, unauthorized } = require("./http-utils");

const config = readConfig();
const logger = createLogger("fulfillment");

fs.mkdirSync(path.dirname(config.stateFile), { recursive: true });
fs.mkdirSync(config.artifactsDir, { recursive: true });

const store = new StateStore(config.stateFile, logger);
const mappings = new MappingRegistry(config.mappingFile, logger);
const processor = new Processor({
  store,
  mappings,
  adapters,
  config,
  logger,
});

function hasAdminAccess(request) {
  if (!config.adminToken) return true;

  const header = request.headers.authorization || "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim()
    : "";

  const alt = String(request.headers["x-admin-token"] || "").trim();
  return bearer === config.adminToken || alt === config.adminToken;
}

function webhookSecretValid(requestUrl, request) {
  if (!config.webhookSecret) return true;

  const fromQuery = requestUrl.searchParams.get("secret") || "";
  const fromHeader =
    String(request.headers["x-fulfillment-webhook-secret"] || "") ||
    String(request.headers["x-webhook-secret"] || "");

  return fromQuery === config.webhookSecret || fromHeader === config.webhookSecret;
}

function enqueueParsedWebhook(parsed, rawPayload) {
  const items = parsed.items.map((item) => ({
    orderId: parsed.orderId,
    sellauthProductId: item.sellauthProductId,
    quantity: item.quantity,
    variantId: item.variantId,
    raw: rawPayload,
  }));

  return store.enqueueJobs(items, config.maxAttempts);
}

async function handleWebhook(request, response, requestUrl) {
  if (!webhookSecretValid(requestUrl, request)) {
    return unauthorized(response);
  }

  let payload;
  try {
    const raw = await readBody(request);
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return badRequest(response, "Invalid JSON payload");
  }

  const parsed = parseWebhook(payload);

  if (!parsed.orderId) {
    return badRequest(response, "Missing order/invoice id in webhook payload");
  }

  if (!parsed.paid) {
    return json(response, 202, {
      success: true,
      accepted: false,
      message: "Webhook ignored (not a paid/completed event)",
      status: parsed.rawStatus,
    });
  }

  if (parsed.items.length === 0) {
    return json(response, 202, {
      success: true,
      accepted: false,
      message: "No purchasable items found in webhook payload",
      orderId: parsed.orderId,
    });
  }

  const jobs = enqueueParsedWebhook(parsed, payload);

  return json(response, 200, {
    success: true,
    accepted: true,
    orderId: parsed.orderId,
    queued: jobs.length,
    jobIds: jobs.map((job) => job.id),
  });
}

async function handleManualJob(request, response) {
  if (!hasAdminAccess(request)) {
    return unauthorized(response);
  }

  let payload;
  try {
    payload = JSON.parse((await readBody(request)) || "{}");
  } catch {
    return badRequest(response, "Invalid JSON payload");
  }

  const orderId = String(payload.orderId || "").trim();
  const productId = Number(payload.sellauthProductId);
  const quantity = Math.max(1, Number(payload.quantity || 1));
  const variantId = payload.variantId ? Number(payload.variantId) : null;

  if (!orderId) return badRequest(response, "orderId is required");
  if (!Number.isFinite(productId) || productId <= 0) {
    return badRequest(response, "sellauthProductId is required");
  }

  const jobs = store.enqueueJobs(
    [
      {
        orderId,
        sellauthProductId: productId,
        quantity,
        variantId,
        provider: payload.provider || null,
        providerProductId: payload.providerProductId || null,
        coin: payload.coin || null,
        raw: payload.raw || null,
      },
    ],
    config.maxAttempts
  );

  return json(response, 200, {
    success: true,
    queued: jobs.length,
    job: jobs[0],
  });
}

function routeOrder(request, response, orderId) {
  if (!hasAdminAccess(request)) {
    return unauthorized(response);
  }

  const order = store.getOrder(orderId);
  if (!order) return notFound(response);

  return json(response, 200, {
    success: true,
    order,
  });
}

function routeJobs(request, response, requestUrl) {
  if (!hasAdminAccess(request)) {
    return unauthorized(response);
  }

  const limit = Number(requestUrl.searchParams.get("limit") || 50);
  return json(response, 200, {
    success: true,
    jobs: store.listJobs(limit),
  });
}

const server = http.createServer(async (request, response) => {
  if (!request.url) return notFound(response);

  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "GET" && requestUrl.pathname === "/health") {
      return json(response, 200, {
        success: true,
        service: "fulfillment-worker",
        queue: {
          queued: store.snapshot().jobs.filter((job) => job.status === "queued").length,
          processing: store.snapshot().jobs.filter((job) => job.status === "processing").length,
        },
      });
    }

    if (request.method === "POST" && requestUrl.pathname === "/webhooks/sellauth") {
      return handleWebhook(request, response, requestUrl);
    }

    if (request.method === "POST" && requestUrl.pathname === "/jobs/manual") {
      return handleManualJob(request, response);
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/orders/")) {
      const orderId = decodeURIComponent(requestUrl.pathname.slice("/orders/".length));
      return routeOrder(request, response, orderId);
    }

    if (request.method === "GET" && requestUrl.pathname === "/jobs") {
      return routeJobs(request, response, requestUrl);
    }

    return notFound(response);
  } catch (error) {
    logger.error("Unhandled request error", {
      error: error instanceof Error ? error.message : String(error),
      path: requestUrl.pathname,
      method: request.method,
    });
    return json(response, 500, { success: false, message: "Internal server error" });
  }
});

server.listen(config.port, config.host, () => {
  logger.info("Fulfillment server listening", {
    host: config.host,
    port: config.port,
    mappingFile: config.mappingFile,
  });
  processor.start();
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down");
  processor.stop();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down");
  processor.stop();
  server.close(() => process.exit(0));
});
