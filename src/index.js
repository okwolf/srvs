#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import server from "./server/index.js";
import { withGreen, withYellow, withCyan, withWhite } from "./colors.js";
import openBrowser from "./client/openBrowser.js";
import availableUrls from "./client/availableUrls.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = process.argv
  .filter(opt => opt.startsWith("--"))
  .map(opt => opt.substring(2).split("="))
  .reduce(
    (otherOpts, [key, value]) =>
      Object.assign(otherOpts, { [key]: !value ? true : value }),
    {}
  );

server(options).then(config => {
  const packagePath = path.resolve(__dirname, "../package.json");
  const packageText = fs.readFileSync(packagePath);
  const { version } = JSON.parse(packageText);
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
