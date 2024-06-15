import path from "path";
import getImportInfo from "./getImportInfo.js";
import normalizePath from "../normalizePath.js";

const ES6_IMPORT_REGEX = /(import[\s\S]+?from)\s+?['"]([^"']+)["']?;?/g;
const ES6_EXPORT_REGEX = /(export[\s\S]+?from)\s+?['"]([^"']+)["']?;?/g;

export default ({ contents = "", searchPath = "", importContext = "" }) =>
  contents
    .replace(ES6_IMPORT_REGEX, (match, imports, module) => {
      if (module.startsWith(".")) {
        return match;
      }
      const { isInstalled, moduleName, moduleVersion, relativeModulePath } =
        getImportInfo({
          importPath: module,
          searchPath
        });
      if (isInstalled) {
        const moduleImportPath = normalizePath(
          path.join("/node_modules", module, relativeModulePath)
        );
        return `${imports} "${moduleImportPath}"`;
      }
      return `${imports} "https://unpkg.com/${moduleName}${
        moduleVersion ? `@${moduleVersion}` : ""
      }?module"`;
    })
    .replace(ES6_EXPORT_REGEX, (_, exports, module) => {
      const resolvedRelativeImport =
        (importContext && path.dirname(module) !== ".") ||
        !path.basename(module).includes(".")
          ? normalizePath(path.join(importContext, module))
          : module;
      const importPrefix = resolvedRelativeImport.startsWith(".") ? "" : "./";
      return `${exports} "${importPrefix}${resolvedRelativeImport}"`;
    });
