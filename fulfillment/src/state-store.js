/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function nowIso() {
  return new Date().toISOString();
}

function defaultState() {
  return {
    jobs: [],
    orders: {},
  };
}

class StateStore {
  constructor(filePath, logger) {
    this.filePath = filePath;
    this.logger = logger;
    this.state = defaultState();
    this._load();
  }

  _load() {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      this._persist();
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
        orders: parsed.orders && typeof parsed.orders === "object" ? parsed.orders : {},
      };
    } catch (error) {
      this.logger.error("Failed to load state file, resetting", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.state = defaultState();
      this._persist();
    }
  }

  _persist() {
    const temp = `${this.filePath}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(this.state, null, 2));
    fs.renameSync(temp, this.filePath);
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  enqueueJobs(items, maxAttempts) {
    const createdAt = nowIso();
    const jobs = items.map((item) => ({
      id: crypto.randomUUID(),
      orderId: String(item.orderId),
      sellauthProductId: Number(item.sellauthProductId),
      quantity: Math.max(1, Number(item.quantity || 1)),
      variantId: item.variantId ? Number(item.variantId) : null,
      paymentMethod: item.paymentMethod ? String(item.paymentMethod) : null,
      customerEmail: item.customerEmail || null,
      provider: item.provider || null,
      providerProductId: item.providerProductId || null,
      coin: item.coin || null,
      raw: item.raw || null,
      status: "queued",
      attempts: 0,
      maxAttempts: Number(maxAttempts || 3),
      nextRunAt: Date.now(),
      error: null,
      result: null,
      createdAt,
      updatedAt: createdAt,
    }));

    for (const job of jobs) {
      this.state.jobs.push(job);
      if (!this.state.orders[job.orderId]) {
        this.state.orders[job.orderId] = {
          orderId: job.orderId,
          status: "queued",
          licenseKeys: [],
          jobs: [],
          createdAt,
          updatedAt: createdAt,
        };
      }
      this.state.orders[job.orderId].jobs.push(job.id);
      this.state.orders[job.orderId].updatedAt = createdAt;
      this.state.orders[job.orderId].status = "queued";
    }

    this._persist();
    return jobs;
  }

  getNextQueuedJob() {
    const now = Date.now();
    const job = this.state.jobs.find(
      (item) => item.status === "queued" && Number(item.nextRunAt || 0) <= now
    );
    return job || null;
  }

  markProcessing(jobId) {
    const job = this.state.jobs.find((item) => item.id === jobId);
    if (!job) return null;
    job.status = "processing";
    job.updatedAt = nowIso();

    const order = this.state.orders[job.orderId];
    if (order) {
      order.status = "processing";
      order.updatedAt = job.updatedAt;
    }

    this._persist();
    return job;
  }

  markFulfilled(jobId, result) {
    const job = this.state.jobs.find((item) => item.id === jobId);
    if (!job) return null;

    const updatedAt = nowIso();
    job.status = "fulfilled";
    job.result = result;
    job.error = null;
    job.updatedAt = updatedAt;

    const order = this.state.orders[job.orderId];
    if (order) {
      const existing = Array.isArray(order.licenseKeys) ? order.licenseKeys : [];
      const incoming = Array.isArray(result.licenseKeys) ? result.licenseKeys : [];
      order.licenseKeys = [...new Set([...existing, ...incoming])];
      order.status = "fulfilled";
      order.updatedAt = updatedAt;
      order.provider = result.provider || order.provider || null;
      order.meta = {
        ...(order.meta || {}),
        ...(result.meta || {}),
      };
    }

    this._persist();
    return job;
  }

  markFailed(jobId, errorMessage) {
    const job = this.state.jobs.find((item) => item.id === jobId);
    if (!job) return null;

    job.attempts += 1;
    job.error = errorMessage;
    job.updatedAt = nowIso();

    const permanent = job.attempts >= job.maxAttempts;
    if (permanent) {
      job.status = "failed";
    } else {
      job.status = "queued";
      const backoffMs = Math.min(60_000, job.attempts * 5_000);
      job.nextRunAt = Date.now() + backoffMs;
    }

    const order = this.state.orders[job.orderId];
    if (order) {
      order.status = permanent ? "failed" : "queued";
      order.updatedAt = job.updatedAt;
      order.lastError = errorMessage;
    }

    this._persist();
    return job;
  }

  getOrder(orderId) {
    return this.state.orders[String(orderId)] || null;
  }

  listJobs(limit = 50) {
    const count = Math.max(1, Math.min(500, Number(limit) || 50));
    return [...this.state.jobs].reverse().slice(0, count);
  }
}

module.exports = { StateStore };
