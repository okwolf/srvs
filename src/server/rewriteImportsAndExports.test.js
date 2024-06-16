import path from "path";
import { fileURLToPath } from "url";
import rewriteImportsAndExports from "./rewriteImportsAndExports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fakeProjectPath = path.join(__dirname, "fake-project");

export default {
  rewriteImportsAndExports: {
    "should be a function": [typeof rewriteImportsAndExports, "function"],
    "should handle missing contents": [rewriteImportsAndExports({}), ""],
    imports: {
      relative: {
        "without hot id": {
          "should not modify relative imports": [
            rewriteImportsAndExports({
              contents: `import something from "./somewhere"`
            }),
            `import something from "./somewhere"`
          ],
          "should not modify relative subfolder imports": [
            rewriteImportsAndExports({
              contents: `import stuff from "./sub/folder"`
            }),
            `import stuff from "./sub/folder"`
          ]
        },
        "with hot id": {
          "should add hot id to relative imports": [
            rewriteImportsAndExports({
              contents: `import something from "./somewhere"`,
              hotId: "1"
            }),
            `import something from "./somewhere?hot=1"`
          ],
          "should add hot id to relative imports with existing query strings": [
            rewriteImportsAndExports({
              contents: `import something from "./somewhere?existing=true"`,
              hotId: "1"
            }),
            `import something from "./somewhere?existing=true&hot=1"`
          ],
          "should add hot id to relative imports with existing hot id": [
            rewriteImportsAndExports({
              contents: `import something from "./somewhere?existing=true&hot=-1"`,
              hotId: "1"
            }),
            `import something from "./somewhere?existing=true&hot=1"`
          ]
        }
      },
      absolute: {
        "not installed": {
          "without version should rewrite to default esm.sh": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(
                fakeProjectPath,
                "not-installed",
                "no-version"
              )
            }),
            `import { app, h } from "https://esm.sh/fake-package"`
          ],
          "with version should rewrite to esm.sh with version": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(
                fakeProjectPath,
                "not-installed",
                "with-version"
              )
            }),
            `import { app, h } from "https://esm.sh/fake-package@1.0.0"`
          ],
          "should rewrite org packages to esm.sh": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "@fake/package"`,
              searchPath: path.join(
                fakeProjectPath,
                "not-installed",
                "no-version"
              )
            }),
            `import { app, h } from "https://esm.sh/@fake/package"`
          ]
        },
        installed: {
          "should rewrite to local node_modules": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import { app, h } from "/node_modules/fake-package";`
          ],
          "should rewrite org packages to local node_modules": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "@fake/package"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import { app, h } from "/node_modules/@fake/package";`
          ],
          "subfolder should rewrite to local node_modules": [
            rewriteImportsAndExports({
              contents: `import { stuff } from "fake-package/subfolder"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import { stuff } from "/node_modules/fake-package/subfolder";`
          ],
          "module should rewrite to local node_modules": [
            rewriteImportsAndExports({
              contents: `import something from "module-package"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import something from "/node_modules/module-package/some/path/module.js";`
          ],
          "main should rewrite to local node_modules": [
            rewriteImportsAndExports({
              contents: `import something from "main-package"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import something from "/node_modules/main-package/other/path/main.js";`
          ],
          "should append hot id when passed and missing": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(fakeProjectPath, "installed"),
              hotId: "1"
            }),
            `import { app, h } from "/node_modules/fake-package?hot=1";`
          ],
          "should update hot id when passed and existing query string": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package?existing=true"`,
              searchPath: path.join(fakeProjectPath, "installed"),
              hotId: "1"
            }),
            `import { app, h } from "/node_modules/fake-package?existing=true&hot=1";`
          ],
          "should update hot id when passed and existing hot id": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package?existing=true&hot=-1"`,
              searchPath: path.join(fakeProjectPath, "installed"),
              hotId: "1"
            }),
            `import { app, h } from "/node_modules/fake-package?existing=true&hot=1";`
          ]
        }
      }
    },
    exports: {
      "should resolve relative subfolder to index without extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./subfolder/index"`,
          importContext: "folder"
        }),
        `export { default } from "./folder/subfolder/index"`
      ],
      "should resolve relative subfolder to index with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./subfolder/index.js"`,
          importContext: "folder"
        }),
        `export { default } from "./folder/subfolder/index.js"`
      ],
      "should resolve relative subfolder to non index file with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./somewhere/name.js"`,
          importContext: "test"
        }),
        `export { default } from "./test/somewhere/name.js"`
      ],
      "should resolve relative root to non index file without extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./name"`,
          importContext: "folder"
        }),
        `export { default } from "./folder/name"`
      ],
      "should resolve relative root to non index file with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./name.js"`,
          importContext: "folder"
        }),
        `export { default } from "./name.js"`
      ]
    }
  }
};
