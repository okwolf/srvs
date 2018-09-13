const path = require("path");

const fakeProjectPath = path.join(__dirname, "fake-project");

const rewriteImportsAndExports = require("../../src/server/rewriteImportsAndExports");
export default {
  rewriteImportsAndExports: {
    "should be a function": [typeof rewriteImportsAndExports, "function"],
    imports: {
      "should not modify relative imports": [
        rewriteImportsAndExports({
          contents: `import something from "./somewhere"`
        }),
        `import something from "./somewhere"`
      ],
      absolute: {
        "not installed": {
          "without version should rewrite to default unpkg": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(
                fakeProjectPath,
                "not-installed",
                "no-version"
              )
            }),
            `import { app, h } from "https://unpkg.com/fake-package?module"`
          ],
          "with version should rewrite to unpkg with version": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(
                fakeProjectPath,
                "not-installed",
                "with-version"
              )
            }),
            `import { app, h } from "https://unpkg.com/fake-package@1.0.0?module"`
          ]
        },
        installed: {
          "with version should rewrite to local node_modules": [
            rewriteImportsAndExports({
              contents: `import { app, h } from "fake-package"`,
              searchPath: path.join(fakeProjectPath, "installed")
            }),
            `import { app, h } from "/node_modules/fake-package"`
          ]
        }
      }
    },
    exports: {
      "should resolve relative subfolder to index without extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./subfolder/index"`,
          importContext: "/folder"
        }),
        `export { default } from "./folder/subfolder/index"`
      ],
      "should resolve relative subfolder to index with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./subfolder/index.js"`,
          importContext: "/folder"
        }),
        `export { default } from "./folder/subfolder/index.js"`
      ],
      "should resolve relative subfolder to non index file with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./somewhere/name.js"`,
          importContext: "/test"
        }),
        `export { default } from "./test/somewhere/name.js"`
      ],
      "should resolve relative root to non index file without extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./name"`,
          importContext: "/folder"
        }),
        `export { default } from "./folder/name"`
      ],
      "should resolve relative root to non index file with extension": [
        rewriteImportsAndExports({
          contents: `export { default } from "./name.js"`,
          importContext: "/folder"
        }),
        `export { default } from "./name.js"`
      ]
    }
  }
};
