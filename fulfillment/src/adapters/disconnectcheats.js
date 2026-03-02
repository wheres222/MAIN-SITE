/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { chromium } = require("playwright");

function boolFromValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function resolveProductUrl(providerProductId) {
  const raw = String(providerProductId || "").trim();
  if (!raw) {
    throw new Error("disconnectcheats adapter requires providerProductId");
  }

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\d+$/.test(raw)) {
    return `https://disconnectcheats.com/store/product/${raw}`;
  }
  if (raw.startsWith("/")) {
    return `https://disconnectcheats.com${raw}`;
  }

  return `https://disconnectcheats.com/${raw}`;
}

async function firstText(page, selectors) {
  for (const selector of selectors) {
    try {
      const value = await page.locator(selector).first().textContent({ timeout: 1500 });
      if (value && value.trim()) return value.trim();
    } catch {
      // try next selector
    }
  }
  return "";
}

async function firstAttr(page, selectors, attr) {
  for (const selector of selectors) {
    try {
      const value = await page.locator(selector).first().getAttribute(attr, { timeout: 1500 });
      if (value && value.trim()) return value.trim();
    } catch {
      // try next selector
    }
  }
  return "";
}

module.exports = {
  key: "disconnectcheats",

  async fulfill(context) {
    const { job, mapping, quantity, logger, artifactsDir } = context;

    const productUrl = resolveProductUrl(mapping.providerProductId);
    const testMode =
      boolFromValue(mapping.testMode, undefined) ??
      boolFromValue(process.env.DISCONNECTCHEATS_TEST_MODE, true);

    logger.info("disconnectcheats adapter start", {
      jobId: job.id,
      orderId: job.orderId,
      productUrl,
      quantity,
      testMode,
    });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(productUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      await page.waitForTimeout(1200);

      const pageTitle = await page.title();
      const h1 = await firstText(page, ["h1", ".ipsType_pageTitle", ".product-title", "main h1"]);
      const priceText = await firstText(page, [
        ".product-price",
        ".ipsType_large.ipsType_warning",
        ".ipsType_veryLarge",
        "[class*='price']",
      ]);
      const stockText = await firstText(page, [
        ".stock",
        "[class*='stock']",
        ".ipsType_light",
      ]);
      const primaryBuyHref = await firstAttr(page, [
        "a[href*='checkout']",
        "a[href*='cart']",
        "a[href*='buy']",
        ".ipsButton[href]",
      ], "href");

      const screenshotPath = path.join(artifactsDir, `disconnectcheats-${job.id}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      if (!testMode) {
        throw new Error(
          "disconnectcheats live-purchase mode not implemented yet. Keep testMode=true until selectors + login/crypto flow are configured."
        );
      }

      const keyCount = Math.max(1, quantity);
      const licenseKeys = Array.from({ length: keyCount }).map((_, index) => {
        const i = String(index + 1).padStart(2, "0");
        return `TEST-DC-${job.id.slice(0, 8)}-${i}`;
      });

      return {
        provider: "disconnectcheats",
        licenseKeys,
        meta: {
          mode: "test",
          productUrl,
          pageTitle,
          heading: h1,
          priceText,
          stockText,
          primaryBuyHref,
          screenshotPath,
        },
      };
    } finally {
      await browser.close();
    }
  },
};
