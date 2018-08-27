const http = require("http");
const path = require("path");
const fs = require("fs");
const streamPath = require("./streamPath");
const { withRed, withGreen } = require("../colors");

const INDEX_HTML_FILE = "index.html";

const HOT_ENDPOINT = "/hot";
const HOT_SCRIPT = `
<script type="module">
{
  const hotHandlers = [];
  window.module = window.module || {};
  window.module.hot = {
    accept(dependencies, handler) {
      const filter = !dependencies
        ? () => true
        : Array.isArray(dependencies)
          ? name => dependencies.some(dependency => dependency === name)
          : name => dependencies === name;
      hotHandlers.push({ filter, handler });
    }
  };
  new EventSource("${HOT_ENDPOINT}").onmessage = message => {
    const matchingHandlers = hotHandlers.filter(({ filter }) =>
      filter(message.data)
    );
    matchingHandlers.forEach(({ handler }) => handler(message.data));
    if (matchingHandlers.length) {
      console.info("hot reloading:", message.data);
    }
  };
}
</script>`;

module.exports = ({
  port = 8080,
  root = "",
  docRoot = "public",
  scriptRoot = "src",
  hot = false
} = {}) =>
  new Promise(resolve => {
    const rootPath = path.resolve(root);
    const scriptPath = path.resolve(rootPath, scriptRoot);
    const docPath = path.resolve(rootPath, docRoot);
    const clients = [];
    if (hot) {
      fs.watch(scriptPath, { recursive: true }, (_, fileName) => {
        console.log(
          "notifying hot reload clients of modified file:",
          withGreen(fileName)
        );
        clients.forEach(client => {
          client.write(`data: ./${fileName}\n\n`);
        });
      });
    }
    http
      .createServer((request, response) => {
        if (hot && request.url === HOT_ENDPOINT) {
          response.writeHead(200, {
            "Content-Type": "text/event-stream"
          });
          clients.push(response);
          return response.write(": hot reload is enabled\n\n");
        }
        const resolvedUrl = request.url.endsWith("/")
          ? path.join(request.url, INDEX_HTML_FILE)
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

        resolveNodePath()
          .then(nodeResolvedPath => streamPath(nodeResolvedPath, rootPath))
          .catch(() => streamPath(resolvedUrl, rootPath))
          .catch(() => streamPath(path.resolve(docPath, INDEX_HTML_FILE)))
          .then(({ fileName, fileStream, mime }) => {
            if (mime) {
              response.setHeader("Content-Type", mime);
            }
            if (hot && fileName === INDEX_HTML_FILE) {
              response.write(HOT_SCRIPT);
            }
            fileStream.pipe(response);
          })
          .catch(error => {
            console.error(withRed(error));
            response.writeHead(500);
            response.end(error.toString());
          });
      })
      .listen({ port }, () =>
        resolve({ port, root, docRoot, scriptRoot, hot })
      );
  });
