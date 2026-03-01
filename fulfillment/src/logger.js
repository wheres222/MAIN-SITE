function stamp(level, message, meta) {
  const ts = new Date().toISOString();
  if (!meta) return `[${ts}] [${level}] ${message}`;
  return `[${ts}] [${level}] ${message} ${JSON.stringify(meta)}`;
}

function createLogger(scope = "fulfillment") {
  return {
    info(message, meta) {
      console.log(stamp(`${scope}:INFO`, message, meta));
    },
    warn(message, meta) {
      console.warn(stamp(`${scope}:WARN`, message, meta));
    },
    error(message, meta) {
      console.error(stamp(`${scope}:ERROR`, message, meta));
    },
  };
}

module.exports = { createLogger };
