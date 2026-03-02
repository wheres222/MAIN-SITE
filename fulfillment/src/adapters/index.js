/* eslint-disable @typescript-eslint/no-require-imports */
const demo = require("./demo");
const playwrightTemplate = require("./playwright-template");
const disconnectcheats = require("./disconnectcheats");

const adapterList = [demo, playwrightTemplate, disconnectcheats];

const adapters = Object.fromEntries(
  adapterList
    .filter((adapter) => adapter && adapter.key)
    .map((adapter) => [adapter.key, adapter])
);

module.exports = { adapters };
