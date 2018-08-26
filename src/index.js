#!/usr/bin/env node

const server = require("./server");
const { withGreen, withYellow, withCyan, withWhite } = require("./colors");
const openBrowser = require("./client/openBrowser");
const availableUrls = require("./client/availableUrls");
const { version } = require("../package.json");

const options = process.argv
  .filter(opt => opt.startsWith("--"))
  .map(opt => opt.substring(2).split("="))
  .reduce(
    (otherOpts, [key, value]) =>
      Object.assign(otherOpts, { [key]: !value ? true : value }),
    {}
  );

server(options).then(config => {
  console.log(withWhite(`srvs v${version}`));
  console.log(withGreen("Available on:"));
  const urls = availableUrls(config);
  urls.forEach(url => {
    console.log(withCyan(`  ${url}`));
  });
  console.log(withYellow("Hit CTRL-C to stop the server"));
  if (urls.length) {
    openBrowser(urls[0]);
  }
});
