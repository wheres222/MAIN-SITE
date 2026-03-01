/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");

module.exports = {
  key: "playwright-template",

  /**
   * Implement provider purchase flow here.
   *
   * context:
   * - job
   * - mapping
   * - quantity
   * - logger
   * - artifactsDir
   */
  async fulfill(context) {
    const { logger, mapping, quantity, artifactsDir } = context;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      logger.info("Template adapter started", {
        providerProductId: mapping.providerProductId,
        quantity,
      });

      // TODO: replace with your provider URL + login + checkout flow.
      // await page.goto(mapping.providerUrl, { waitUntil: "domcontentloaded" });
      // ... perform login, buy, capture keys ...

      // Save debugging artifact example.
      await page.screenshot({ path: `${artifactsDir}/template-last.png`, fullPage: true });

      throw new Error(
        "playwright-template adapter is not configured yet. Duplicate this file for each provider and implement selectors/workflow."
      );
    } finally {
      await browser.close();
    }
  },
};
