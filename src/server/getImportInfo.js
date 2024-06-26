import fs from "fs";
import path from "path";

export default ({ importPath, searchPath }) => {
  const nodeModulesPath = path.resolve(searchPath, "node_modules");
  const moduleName = importPath
    .split("?")[0]
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

  const absoluteImportPath = path.resolve(nodeModulesPath, importPath);
  if (
    fs.existsSync(absoluteImportPath) &&
    fs.statSync(absoluteImportPath).isFile()
  ) {
    resolvedImportPath = absoluteImportPath;
  } else {
    let currentModulePath = path.resolve(nodeModulesPath, importPath);
    while (currentModulePath?.length > 1) {
      const modulePackagePath = path.resolve(currentModulePath, "package.json");
      if (fs.existsSync(modulePackagePath)) {
        const modulePackageText = fs.readFileSync(modulePackagePath);
        const { module, main } = JSON.parse(modulePackageText);
        relativeModulePath = module || main || "";
        resolvedImportPath = path.resolve(
          currentModulePath,
          relativeModulePath
        );
        currentModulePath = null;
      } else {
        currentModulePath = path.resolve(currentModulePath, "..");
      }
    }
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
