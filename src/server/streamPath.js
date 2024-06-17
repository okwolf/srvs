import fs from "fs";
import path from "path";
import stream from "stream";
import querystring from "node:querystring";
import getImportInfo from "./getImportInfo.js";
import rewriteImportsAndExports from "./rewriteImportsAndExports.js";
import normalizePath from "../normalizePath.js";
import mimeLookup from "./mimeLookup.js";
const NODE_MODULES_REGEX = /^\/node_modules\//;

const getImportMetaHotHeader = filePath => `
{
  import.meta.hot = {};
  const dataListener = e => {
    if (e.detail.path === "${filePath}") {
      import.meta.hot.data = e.detail.data;
      document.removeEventListener("srvsdisposedata", dataListener);
    }
  };
  document.addEventListener("srvsdisposedata", dataListener);
  document.dispatchEvent(
    new CustomEvent("srvsdispose", {
      detail: { path: "${filePath}" }
    })
  );
  import.meta.hot.accept = handler => {
    const listener = e => {
      const importUrl = new URL(import.meta.url);
      importUrl.searchParams.set("hot", Date.now());
      const getUpdated = () => import(importUrl);
      if (handler(e.detail, getUpdated)) {
        e.preventDefault();
      }
    };
    const disposeListener = e => {
      if (e.detail.path === "${filePath}") {
        document.dispatchEvent(
          new CustomEvent("srvsdisposedata", {
            detail: { path: "${filePath}", data: import.meta.hot.data }
          })
        );
        document.removeEventListener("srvshot", listener);
        document.removeEventListener("srvsdispose", disposeListener);
      }
    };
    document.addEventListener("srvshot", listener);
    document.addEventListener("srvsdispose", disposeListener);
  };
  import.meta.hot.dispose = handler => {
    const disposeListener = e => {
      if (e.detail.path === "${filePath}") {
        handler();
        document.removeEventListener("srvsdispose", disposeListener);
      }
    };
    document.addEventListener("srvsdispose", disposeListener);
  };
}
`;

const rewrite = (header, rewritter = chunk => chunk) =>
  new stream.Transform({
    transform(chunk, _, next) {
      if (!this.started) {
        this.push(header);
        this.started = true;
      }
      const rewritten = rewritter(chunk.toString());
      this.push(rewritten);
      next();
    }
  });

const rewriteScript = ({ filePath, searchPath, importContext, hotId }) =>
  rewrite(getImportMetaHotHeader(filePath), contents =>
    rewriteImportsAndExports({
      contents,
      searchPath,
      importContext,
      hotId
    })
  );

const streamFile = ({
  filePath,
  searchPath,
  importContext,
  hotId,
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
          ? fileStream.pipe(
              rewriteScript({ filePath, searchPath, importContext, hotId })
            )
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

export default ({
  originalUrl,
  filePath,
  searchPath = "",
  relativeImportPath = ""
}) =>
  new Promise((resolve, reject) => {
    const parsedQuery = querystring.parse(
      originalUrl?.substring(originalUrl.indexOf("?") + 1)
    );
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
        streamFile({
          filePath,
          searchPath,
          importContext,
          hotId: parsedQuery.hot,
          resolve,
          reject
        });
      });
    }
  });
