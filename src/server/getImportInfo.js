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
    resolvedImportPath,
    isInstalled
  };
};
