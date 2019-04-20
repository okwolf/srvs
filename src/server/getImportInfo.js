const fs = require("fs");
const path = require("path");

module.exports = ({ importPath, searchPath }) => {
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
  const isInstalled = fs.existsSync(installedModulePath);
  let relativeModulePath = "";
  let resolvedImportPath;

  if (moduleName === importPath) {
    try {
      const modulePackagePath = path.resolve(
        installedModulePath,
        "package.json"
      );
      delete require.cache[modulePackagePath];
      const { module, main } = require(modulePackagePath);
      relativeModulePath = module || main || "";
      resolvedImportPath = path.resolve(
        installedModulePath,
        relativeModulePath
      );
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
    relativeModulePath,
    resolvedImportPath,
    isInstalled
  };
};
