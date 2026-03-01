/* eslint-disable @typescript-eslint/no-require-imports */
const demo = require("./demo");
const playwrightTemplate = require("./playwright-template");

const adapterList = [demo, playwrightTemplate];

const adapters = Object.fromEntries(
  adapterList
    .filter((adapter) => adapter && adapter.key)
    .map((adapter) => [adapter.key, adapter])
);

module.exports = { adapters };
