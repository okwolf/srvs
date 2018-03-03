const http = require("http");
const path = require("path");
const fs = require("fs");
const streamPath = require("./streamPath");

const INDEX_HTML_FILE = "index.html";
const INDEX_JS_FILE = "index.js";
const HOT_ENDPOINT = "/hot";

const HOT_SCRIPT = `
<script>
const hotHandlers = [];
window.module = window.module || {};
window.module.hot = {
  accept(dependencies, handler) {
    const hotFilter = !dependencies ? () => true
      : Array.isArray(dependencies) ? name =>
        dependencies.some(dependency => dependency === name)
      : name => dependencies === name;
    hotHandlers.push([hotFilter, handler]);
  }
};
new EventSource("${HOT_ENDPOINT}").onmessage = message => {
  hotHandlers.forEach(([filter, handler]) => {
    if(filter(message.data)) {
      handler(message.data)
    }
  })
};
</script>`;

const mapValues = mapper => obj =>
  Object.keys(obj).reduce(
    (otherValues, key) =>
      Object.assign(otherValues, { [key]: mapper(obj[key]) }),
    {}
  );

const getDependencies = () => {
  try {
    const packagePath = path.join(process.cwd(), "package");
    const packageJson = require(packagePath);
    return mapValues(version => version.replace(/[~^*>=]/g, ""))(
      packageJson.dependencies
    );
  } catch (e) {}
  return {};
};

module.exports = ({
  port = 8080,
  root = "",
  docRoot = "public",
  scriptRoot = "src",
  hot = false
} = {}) =>
  new Promise(resolve => {
    const clients = [];
    fs.watch(
      path.resolve(root, scriptRoot),
      { recursive: true },
      (_, fileName) => {
        clients.forEach(client => {
          client.write(`data: ./${fileName}\n\n`);
        });
      }
    );
    http
      .createServer((request, response) => {
        if (hot && request.url === HOT_ENDPOINT) {
          clients.push(response);
          return response.writeHead(200, {
            "Content-Type": "text/event-stream"
          });
        }
        const streamFromCurrentFolder = (...paths) => () =>
          streamPath(
            path.join(root, paths[0]),
            path.join(root, ...paths),
            getDependencies(root)
          );
        const resolvedUrl = request.url.endsWith("/")
          ? path.join(request.url, INDEX_HTML_FILE)
          : request.url;
        streamFromCurrentFolder(scriptRoot, resolvedUrl)()
          .catch(streamFromCurrentFolder(scriptRoot, `${resolvedUrl}.js`))
          .catch(
            streamFromCurrentFolder(
              scriptRoot,
              resolvedUrl.substring(0, resolvedUrl.indexOf("?"))
            )
          )
          .catch(
            streamFromCurrentFolder(scriptRoot, resolvedUrl, INDEX_JS_FILE)
          )
          .catch(streamFromCurrentFolder(docRoot, resolvedUrl))
          .catch(
            streamFromCurrentFolder(
              docRoot,
              resolvedUrl.substring(0, resolvedUrl.indexOf("?"))
            )
          )
          .catch(streamFromCurrentFolder(docRoot, INDEX_HTML_FILE))
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
            response.writeHead(500);
            response.end(JSON.stringify(error));
          });
      })
      .listen({ port }, () => resolve({ port, root, docRoot, scriptRoot }));
  });
