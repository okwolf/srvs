const fs = require("fs");
const path = require("path");
const stream = require("stream");
const mimeLookup = require("./mimeLookup");

const ES6_IMPORT_REGEX = /(import[\s\S]+?from)\s+?[\'"]([^"\']+)["\']?;?/g;
const ES6_EXPORT_REGEX = /(export[\s\S]+?from)\s+?[\'"]([^"\']+)["\']?;?/g;

const rewrite = (rewritter = chunk => chunk) =>
  new stream.Transform({
    transform(chunk, encoding, next) {
      const rewritten = rewritter(chunk.toString());
      this.push(rewritten);
      next();
    }
  });

const rewriteScript = (contextPath, withVersion) =>
  rewrite(chunk =>
    chunk
      .replace(
        ES6_IMPORT_REGEX,
        (match, imports, module) =>
          `${imports} "${
            module.startsWith(".")
              ? `${contextPath}/${module}`
              : `https://unpkg.com/${withVersion(module)}?module`
          }"`
      )
      .replace(
        ES6_EXPORT_REGEX,
        (match, exports, module) => `${exports} "${contextPath}/${module}"`
      )
  );

module.exports = (relativeFolder, filePath, dependencies) =>
  new Promise((resolve, reject) => {
    fs.lstat(filePath, (err, stats) => {
      if (err) {
        return reject(err);
      } else if (stats.isDirectory()) {
        return reject("can't stream a directory");
      }

      const mime = mimeLookup[path.extname(filePath).toLowerCase()];
      const fileStream = fs.createReadStream(filePath);
      const contextPath = path
        .dirname(filePath)
        .substring(relativeFolder.length)
        .replace(/\\/g, "/");
      const withVersion = module =>
        dependencies[module] ? `${module}@${dependencies[module]}` : module;
      fileStream.on("open", () => {
        resolve({
          fileStream:
            mime === "application/javascript"
              ? fileStream.pipe(rewriteScript(contextPath, withVersion))
              : fileStream,
          mime
        });
      });
      fileStream.on("error", reject);
    });
  });
