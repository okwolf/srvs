const fs = require("fs");
const path = require("path");
const stream = require("stream");
const mimeLookup = require("./mimeLookup");

const ES6_IMPORT_REGEX = /(import[\s\S]+?from)\s+?[\'"]([^"\']+)["\']?;?/g;
const ES6_EXPORT_FROM_REGEX = /(export[\s\S]+?from)\s+?[\'"]([^"\']+)["\']?;?/g;

const rewrite = (rewritter = chunk => chunk) =>
  new stream.Transform({
    transform(chunk, encoding, next) {
      const rewritten = rewritter(chunk.toString());
      this.push(rewritten);
      next();
    }
  });

const rewriteScript = contextPath =>
  rewrite(chunk =>
    chunk
      .replace(
        ES6_IMPORT_REGEX,
        (match, imports, module) =>
          `${imports} "${module.startsWith(".")
            ? module
            : `https://unpkg.com/${module}?main=module`}"`
      )
      .replace(
        ES6_EXPORT_FROM_REGEX,
        (match, exports, module) => `${exports} "${contextPath}/${module}"`
      )
  );

module.exports = (contextPath, filePath) =>
  new Promise((resolve, reject) => {
    fs.lstat(filePath, (err, stats) => {
      if (err) {
        return reject(err);
      } else if (stats.isDirectory()) {
        return reject("can't stream a directory");
      }

      const mime = mimeLookup[path.extname(filePath).toLowerCase()];
      const fileStream = fs.createReadStream(filePath);
      fileStream.on("open", () => {
        resolve({
          fileStream:
            mime === "application/javascript"
              ? fileStream.pipe(rewriteScript(contextPath))
              : fileStream,
          mime
        });
      });
      fileStream.on("error", reject);
    });
  });
