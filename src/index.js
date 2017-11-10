#!/usr/bin/env node

const server = require("./server");
const openBrowser = require("./client/openBrowser");
const availableUrls = require("./client/availableUrls");

server().then(({ port }) => {
  console.log("\x1b[32m%s\x1b[0m", "Available on:");
  const urls = availableUrls({ port });
  urls.forEach(url => {
    console.log("\x1b[36m%s\x1b[0m", `  ${url}`);
  });
  console.log("\x1b[33m%s\x1b[0m", "Hit CTRL-C to stop the server");
  if (urls.length) {
    openBrowser(urls[0]);
  }
});
