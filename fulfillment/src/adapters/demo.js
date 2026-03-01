async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  key: "demo",
  async fulfill(context) {
    const {
      job,
      mapping,
      logger,
      quantity,
    } = context;

    logger.info("Demo adapter running", {
      jobId: job.id,
      providerProductId: mapping.providerProductId,
      quantity,
    });

    await sleep(1200);

    const licenseKeys = Array.from({ length: quantity }).map((_, index) => {
      const suffix = String(index + 1).padStart(2, "0");
      return `DEMO-${mapping.providerProductId || job.sellauthProductId}-${job.id.slice(0, 8)}-${suffix}`;
    });

    return {
      provider: "demo",
      licenseKeys,
      meta: {
        note: "Demo adapter used. Replace with real provider automation.",
      },
    };
  },
};
