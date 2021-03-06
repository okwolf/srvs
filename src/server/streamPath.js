const fs = require("fs");
const path = require("path");
const stream = require("stream");
const getImportInfo = require("./getImportInfo");
const rewriteImportsAndExports = require("./rewriteImportsAndExports");
const normalizePath = require("../normalizePath");
const mimeLookup = require("./mimeLookup");
const NODE_MODULES_REGEX = /^\/node_modules\//;

const rewrite = (rewritter = chunk => chunk) =>
  new stream.Transform({
    transform(chunk, _, next) {
      const rewritten = rewritter(chunk.toString());
      this.push(rewritten);
      next();
    }
  });

const rewriteScript = ({ searchPath, importContext }) =>
  rewrite(contents =>
    rewriteImportsAndExports({ contents, searchPath, importContext })
  );

const streamFile = ({
  filePath,
  searchPath,
  importContext,
  resolve,
  reject
}) => {
  const mime = mimeLookup[path.extname(filePath).toLowerCase()];
  const fileStream = fs.createReadStream(filePath);
  fileStream.on("open", () => {
    const fileName = path.basename(filePath);
    resolve({
      fileName,
      fileStream:
        mime === "application/javascript"
          ? fileStream.pipe(rewriteScript({ searchPath, importContext }))
          : fileStream,
      mime
    });
  });
  fileStream.on("error", reject);
};

const streamModule = ({ importPath, searchPath, resolve, reject }) => {
  const { resolvedImportPath } = getImportInfo({
    importPath,
    searchPath
  });
  streamFile({
    filePath: resolvedImportPath,
    searchPath,
    resolve,
    reject
  });
};

module.exports = ({ filePath, searchPath = "", relativeImportPath = "" }) =>
  new Promise((resolve, reject) => {
    if (NODE_MODULES_REGEX.test(filePath)) {
      const importPath = filePath.replace(NODE_MODULES_REGEX, "");
      streamModule({ importPath, searchPath, resolve, reject });
    } else {
      fs.lstat(filePath, (err, stats) => {
        if (err) {
          return reject(err);
        } else if (stats.isDirectory()) {
          return reject("can't stream a directory");
        }
        const resolvedRelativeImport = filePath.substring(
          relativeImportPath.length
        );
        const fullImportContext = path.dirname(resolvedRelativeImport);
        const importContext = normalizePath(
          fullImportContext.substring(fullImportContext.lastIndexOf(path.sep))
        );
        streamFile({ filePath, searchPath, importContext, resolve, reject });
      });
    }
  });
