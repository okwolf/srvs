import path from "path";
import querystring from "node:querystring";
import getImportInfo from "./getImportInfo.js";
import normalizePath from "../normalizePath.js";

const ES6_IMPORT_REGEX = /(import[\s\S]*?from)\s*?['"]([^"']+)["']?;?/g;
const ES6_EXPORT_REGEX = /(export[\s\S]*?from)\s*?['"]([^"']+)["']?;?/g;

export default ({
  contents = "",
  searchPath = "",
  importContext = "",
  hotId = ""
}) =>
  contents
    .replace(ES6_IMPORT_REGEX, (match, imports, module) => {
      const addHotId = toModule => {
        if (!hotId) {
          return toModule;
        } else if (toModule.includes("?")) {
          const queryIndex = toModule.indexOf("?");
          const parsedQuery = querystring.parse(
            toModule.substring(queryIndex + 1)
          );
          const updatedQuery = querystring.stringify({
            ...parsedQuery,
            hot: hotId
          });
          return `${toModule.substring(0, queryIndex)}?${updatedQuery}`;
        } else {
          return `${toModule}?hot=${hotId}`;
        }
      };
      if (module.startsWith(".")) {
        return `${imports} "${addHotId(module)}"`;
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
        return `${imports} "${addHotId(moduleImportPath)}";`;
      }
      return `${imports} "https://esm.sh/${moduleName}${
        moduleVersion ? `@${moduleVersion}` : ""
      }${module.substring(moduleName.length)}"`;
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
