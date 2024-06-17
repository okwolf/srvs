import http from "http";
import path from "path";
import fs from "fs";
import { createRequire } from "node:module";
import { withRed, withGreen } from "../colors.js";
import normalizePath from "../normalizePath.js";
import streamPath from "./streamPath.js";

const require = createRequire(import.meta.url);

const INDEX_HTML_FILE = "index.html";

const HOT_ENDPOINT = "/hot";
const HOT_KEEPALIVE_INTERVAL = 30000;
const HOT_DEBOUNCE = 10;
const getInjectedScript = () => `
<script type="module">
{
  new EventSource("${HOT_ENDPOINT}").onmessage = message => {
    const url = message.data;
    const hotRejected = document.dispatchEvent(
      new CustomEvent("srvshot", { cancelable: true, detail: url })
    );
    if (hotRejected) {
      location.reload(true);
    } else {
      console.info("hot reloading:", url);
    }
  };
  window.process = {};
  process.env = ${JSON.stringify(process.env)};
}
</script>`;

export default ({ port = 8080, docRoot = "public", scriptRoot = "src" } = {}) =>
  new Promise(resolve => {
    const rootPath = process.cwd();
    const scriptPath = fs.existsSync(path.resolve(rootPath, scriptRoot))
      ? path.resolve(rootPath, scriptRoot)
      : rootPath;
    const docPath = fs.existsSync(path.resolve(rootPath, docRoot))
      ? path.resolve(rootPath, docRoot)
      : rootPath;
    const hotClients = [];
    const notifyFileNames = new Set();
    let notifyTimeout;
    const notifyHotClients = (_, fileName) => {
      clearTimeout(notifyTimeout);
      notifyFileNames.add(fileName);
      notifyTimeout = setTimeout(() => {
        for (const fileName of notifyFileNames) {
          console.log(
            "notifying hot reload clients of modified file:",
            withGreen(fileName)
          );
          hotClients.forEach(client => {
            client.write(`data: ./${fileName}\n\n`);
          });
        }
        notifyFileNames.clear();
      }, HOT_DEBOUNCE);
    };
    setInterval(() => {
      hotClients.forEach(client => {
        client.write(": staying alive\n\n");
      });
    }, HOT_KEEPALIVE_INTERVAL);
    fs.watch(scriptPath, { recursive: true }, notifyHotClients);
    fs.watch(docPath, { recursive: true }, notifyHotClients);
    fs.watch(rootPath, { recursive: true }, (_, fileName) => {
      if (fileName.startsWith("node_modules/")) {
        notifyHotClients(null, fileName);
      }
    });
    http
      .createServer((request, response) => {
        if (request.url === HOT_ENDPOINT) {
          response.writeHead(200, {
            "Content-Type": "text/event-stream"
          });
          console.log(withGreen("client connected"));
          response.on("close", () => {
            console.log(withRed("client disconnected"));
            hotClients.splice(hotClients.indexOf(response), 1);
          });
          hotClients.push(response);
          return response.write(": hot reload is enabled\n\n");
        }
        const resolvedUrl = request.url.endsWith("/")
          ? normalizePath(path.join(request.url, INDEX_HTML_FILE))
          : request.url;

        const resolveNodePath = () =>
          new Promise((resolve, reject) => {
            try {
              const urlWithoutQuery = resolvedUrl.split("?").slice(0, 1);
              const nodeResolvedPath = require.resolve(`.${urlWithoutQuery}`, {
                paths: [scriptPath, docPath]
              });
              resolve(nodeResolvedPath);
            } catch (error) {
              process.nextTick(() => reject(error));
            }
          });

        streamPath({
          originalUrl: resolvedUrl,
          filePath: resolvedUrl,
          searchPath: rootPath
        })
          .catch(() =>
            resolveNodePath().then(nodeResolvedPath =>
              streamPath({
                originalUrl: resolvedUrl,
                filePath: nodeResolvedPath,
                searchPath: rootPath,
                relativeImportPath: scriptPath
              })
            )
          )
          .catch(() =>
            streamPath({
              originalUrl: resolvedUrl,
              filePath: path.resolve(docPath, INDEX_HTML_FILE)
            })
          )
          .then(({ fileStream, mime }) => {
            if (mime) {
              response.setHeader("Content-Type", mime);
            }
            if (mime === "text/html") {
              response.write(getInjectedScript());
            }
            fileStream.pipe(response);
          })
          .catch(error => {
            console.error(withRed(error));
            response.writeHead(500);
            response.end(error.toString());
          });
      })
      .listen({ port }, () => resolve({ port, docRoot, scriptRoot }));
  });
