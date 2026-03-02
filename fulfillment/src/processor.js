class Processor {
  constructor({ store, mappings, adapters, config, logger }) {
    this.store = store;
    this.mappings = mappings;
    this.adapters = adapters;
    this.config = config;
    this.logger = logger;
    this.timer = null;
    this.active = 0;
    this.running = false;
  }

  start() {
    if (this.timer) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.config.pollMs);
    this.logger.info("Processor started", {
      pollMs: this.config.pollMs,
      concurrency: this.config.concurrency,
      maxAttempts: this.config.maxAttempts,
    });
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    if (!this.running) return;

    while (this.active < this.config.concurrency) {
      const next = this.store.getNextQueuedJob();
      if (!next) return;

      const claimed = this.store.markProcessing(next.id);
      if (!claimed) return;

      this.active += 1;
      this.process(claimed)
        .catch((error) => {
          this.logger.error("Unexpected processing error", {
            jobId: claimed.id,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          this.active -= 1;
        });
    }
  }

  async process(job) {
    this.logger.info("Processing job", {
      jobId: job.id,
      orderId: job.orderId,
      productId: job.sellauthProductId,
      quantity: job.quantity,
      attempt: job.attempts + 1,
    });

    const mapping =
      this.mappings.resolveByProductId(job.sellauthProductId) ||
      (job.provider
        ? {
            provider: job.provider,
            providerProductId: job.providerProductId,
            coin: job.coin,
            testMode: job.testMode,
            minQuantity: 1,
          }
        : null);

    if (!mapping) {
      const message = `No provider mapping for SellAuth product ${job.sellauthProductId}`;
      this.store.markFailed(job.id, message);
      this.logger.warn("Job failed", {
        jobId: job.id,
        orderId: job.orderId,
        error: message,
      });
      return;
    }

    const adapter = this.adapters[mapping.provider];
    if (!adapter) {
      const message = `Unknown provider adapter: ${mapping.provider}`;
      this.store.markFailed(job.id, message);
      this.logger.warn("Job failed", {
        jobId: job.id,
        orderId: job.orderId,
        error: message,
      });
      return;
    }

    const quantity = Math.max(1, Number(job.quantity || 1), Number(mapping.minQuantity || 1));

    try {
      const result = await adapter.fulfill({
        job,
        mapping,
        quantity,
        logger: this.logger,
        artifactsDir: this.config.artifactsDir,
      });

      const keys = Array.isArray(result?.licenseKeys)
        ? result.licenseKeys.filter((key) => typeof key === "string" && key.trim())
        : [];

      if (keys.length === 0) {
        throw new Error("Adapter finished without license keys");
      }

      this.store.markFulfilled(job.id, {
        provider: mapping.provider,
        licenseKeys: keys,
        meta: result.meta || null,
      });

      await this.notifyWebsite(job.orderId, {
        jobId: job.id,
        provider: mapping.provider,
        productId: job.sellauthProductId,
        quantity,
        licenseKeys: keys,
        meta: result.meta || null,
      });

      this.logger.info("Job fulfilled", {
        jobId: job.id,
        orderId: job.orderId,
        keyCount: keys.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.store.markFailed(job.id, message);
      this.logger.warn("Job failed", {
        jobId: job.id,
        orderId: job.orderId,
        error: message,
      });
    }
  }

  async notifyWebsite(orderId, payload) {
    if (!this.config.notifyUrl) return;

    try {
      const response = await fetch(this.config.notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.notifyToken
            ? { Authorization: `Bearer ${this.config.notifyToken}` }
            : {}),
        },
        body: JSON.stringify({ orderId, ...payload }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        this.logger.warn("Website notify failed", {
          status: response.status,
          body: text.slice(0, 400),
        });
      }
    } catch (error) {
      this.logger.warn("Website notify request error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

module.exports = { Processor };
