#!/usr/bin/env node

const server = require("./server");
const openBrowser = require("./client/openBrowser");
const availableUrls = require("./client/availableUrls");
const { version } = require("../package.json");

const options = process.argv
  .filter(opt => opt.startsWith("--"))
  .map(opt => opt.substring(2).split("="))
  .reduce(
    (otherOpts, [key, value]) => Object.assign(otherOpts, { [key]: value }),
    {}
  );

server(options).then(config => {
  console.log("\x1b[37m%s\x1b[0m", `SRVS v${version}`);
  console.log("\x1b[32m%s\x1b[0m", "Available on:");
  const urls = availableUrls(config);
  urls.forEach(url => {
    console.log("\x1b[36m%s\x1b[0m", `  ${url}`);
  });
  console.log("\x1b[33m%s\x1b[0m", "Hit CTRL-C to stop the server");
  if (urls.length) {
    openBrowser(urls[0]);
  }
});
