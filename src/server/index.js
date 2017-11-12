const http = require("http");
const path = require("path");
const streamPath = require("./streamPath");

const INDEX_HTML_FILE = "index.html";
const INDEX_JS_FILE = "index.js";

module.exports = (
  { port = 8080, root = "", docRoot = "public", scriptRoot = "src" } = {}
) =>
  new Promise(resolve =>
    http
      .createServer((request, response) => {
        const streamFromCurrentFolder = (...paths) => () =>
          streamPath(path.join(root, ...paths));
        const resolvedUrl = request.url.endsWith("/")
          ? path.join(request.url, INDEX_HTML_FILE)
          : request.url;
        streamFromCurrentFolder(scriptRoot, resolvedUrl)()
          .catch(streamFromCurrentFolder(scriptRoot, `${resolvedUrl}.js`))
          .catch(
            streamFromCurrentFolder(scriptRoot, resolvedUrl, INDEX_JS_FILE)
          )
          .catch(streamFromCurrentFolder(docRoot, resolvedUrl))
          .catch(streamFromCurrentFolder(docRoot, INDEX_HTML_FILE))
          .then(({ fileStream, mime }) => {
            if (mime) {
              response.setHeader("Content-Type", mime);
            }
            fileStream.pipe(response);
          })
          .catch(error => {
            response.writeHead(404);
            response.end(JSON.stringify(error));
          });
      })
      .listen({ port }, () => resolve({ port, root, docRoot, scriptRoot }))
  );
