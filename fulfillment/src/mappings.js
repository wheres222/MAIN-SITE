/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

function normalizeProductId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

class MappingRegistry {
  constructor(filePath, logger) {
    this.filePath = filePath;
    this.logger = logger;
    this.mappings = [];
    this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      this.logger.warn("Mapping file not found", { file: this.filePath });
      this.mappings = [];
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed.mappings) ? parsed.mappings : [];

      this.mappings = list
        .map((item) => ({
          ...item,
          sellauthProductId: normalizeProductId(item.sellauthProductId),
          minQuantity: Number(item.minQuantity || 1),
        }))
        .filter((item) => item.sellauthProductId !== null && item.provider);

      this.logger.info("Loaded mappings", { count: this.mappings.length });
    } catch (error) {
      this.logger.error("Failed to load mappings", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.mappings = [];
    }
  }

  resolveByProductId(sellauthProductId) {
    const key = normalizeProductId(sellauthProductId);
    if (key === null) return null;
    return this.mappings.find((item) => item.sellauthProductId === key) || null;
  }
}

module.exports = { MappingRegistry };
