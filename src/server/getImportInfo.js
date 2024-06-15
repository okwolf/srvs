import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default ({ importPath, searchPath }) => {
  const nodeModulesPath = path.resolve(searchPath, "node_modules");
  const moduleName = importPath
    .split("/")
    .slice(0, importPath.startsWith("@") ? 2 : 1)
    .join("/");
  const projectPackagePath = path.resolve(searchPath, "package.json");
  const projectPackageText = fs.readFileSync(projectPackagePath);
  const projectPackage = JSON.parse(projectPackageText);
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
      const modulePackageText = fs.readFileSync(modulePackagePath);
      const { module, main } = JSON.parse(modulePackageText);
      relativeModulePath = module || main || "";
      resolvedImportPath = path.resolve(
        installedModulePath,
        relativeModulePath
      );
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // could not resolve
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
