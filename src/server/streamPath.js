const fs = require("fs");
const path = require("path");
const stream = require("stream");
const mimeLookup = require("./mimeLookup");

const ES6_IMPORT_REGEX = /(import[\s\S]+?from)\s+?['"]([^"']+)["']?;?/g;
const ES6_EXPORT_REGEX = /(export[\s\S]+?from)\s+?['"]([^"']+)["']?;?/g;
const NODE_MODULES_REGEX = /^\/node_modules\//;

const getImportInfo = ({ importPath, searchPath }) => {
  const nodeModulesPath = path.resolve(searchPath, "node_modules");
  const moduleName = importPath
    .split("/")
    .slice(0, importPath.startsWith("@") ? 2 : 1)
    .join("/");
  const projectPackagePath = path.resolve(searchPath, "package.json");
  delete require.cache[projectPackagePath];
  const projectPackage = require(projectPackagePath);
  const moduleVersion = (projectPackage.dependencies || {})[moduleName];
  const installedModulePath = path.resolve(nodeModulesPath, moduleName);
  let resolvedImportPath;

  if (moduleName === importPath) {
    try {
      const modulePackagePath = path.resolve(
        installedModulePath,
        "package.json"
      );
      delete require.cache[modulePackagePath];
      const { module } = require(modulePackagePath);
      resolvedImportPath = path.resolve(installedModulePath, module);
    } catch (e) {
      // not installed
    }
  } else {
    resolvedImportPath = require.resolve(importPath, {
      paths: [nodeModulesPath]
    });
  }

  return {
    moduleName,
    moduleVersion,
    installedModulePath,
    resolvedImportPath
  };
};

const rewrite = (rewritter = chunk => chunk) =>
  new stream.Transform({
    transform(chunk, _, next) {
      const rewritten = rewritter(chunk.toString());
      this.push(rewritten);
      next();
    }
  });

const rewriteScript = ({ searchPath, importContext }) =>
  rewrite(chunk =>
    chunk
      .replace(ES6_IMPORT_REGEX, (match, imports, module) => {
        if (module.startsWith(".")) {
          return match;
        }
        const {
          moduleName,
          moduleVersion,
          installedModulePath
        } = getImportInfo({
          importPath: module,
          searchPath
        });
        if (fs.existsSync(installedModulePath)) {
          return `${imports} "/node_modules/${module}"`;
        }
        return `${imports} "https://unpkg.com/${moduleName}${
          moduleVersion ? `@${moduleVersion}` : ""
        }?module"`;
      })
      .replace(ES6_EXPORT_REGEX, (_, exports, module) => {
        const resolvedRelativeImport = importContext
          ? path.join(importContext, module)
          : module;
        return `${exports} ".${resolvedRelativeImport}"`;
      })
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
  const { resolvedImportPath, installedModulePath } = getImportInfo({
    importPath,
    searchPath
  });
  const installedModuleParentPath = path.dirname(installedModulePath);
  const resolvedRelativeImport = resolvedImportPath.substring(
    installedModuleParentPath.length
  );
  const importContext = path.dirname(resolvedRelativeImport);
  streamFile({
    filePath: resolvedImportPath,
    searchPath,
    importContext,
    resolve,
    reject
  });
};

module.exports = (filePath, searchPath = "", relativeImportPath = "") =>
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
        const importContext = fullImportContext.substring(
          fullImportContext.lastIndexOf("/")
        );
        streamFile({ filePath, searchPath, importContext, resolve, reject });
      });
    }
  });
