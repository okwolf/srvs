const http = require("http");
const path = require("path");
const streamPath = require("./streamPath");

const INDEX_HTML_FILE = "index.html";
const INDEX_JS_FILE = "index.js";

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

module.exports = (
  { port = 8080, root = "", docRoot = "public", scriptRoot = "src" } = {}
) =>
  new Promise(resolve =>
    http
      .createServer((request, response) => {
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
