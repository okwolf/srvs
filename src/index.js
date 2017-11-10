#!/usr/bin/env node

const os = require("os");
const server = require("./server");
const openBrowser = require("./client/openBrowser");

const buildUrls = ({ port }) => {
  const interfaces = os.networkInterfaces();
  const urls = Object.keys(interfaces)
    .map(name => interfaces[name].find(({ family }) => family === "IPv4"))
    .filter(interface => interface)
    .map(({ address }) => `http://${address}:${port}`);
  return urls;
};

server().then(({ port }) => {
  console.log("\x1b[32m%s\x1b[0m", "Available on:");
  const urls = buildUrls({ port });
  urls.forEach(url => {
    console.log("\x1b[36m%s\x1b[0m", `  ${url}`);
  });
  console.log("\x1b[33m%s\x1b[0m", "Hit CTRL-C to stop the server");
  if (urls.length) {
    openBrowser(urls[0]);
  }
});
