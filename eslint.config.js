import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: [
      "src/**/*.js",
      "examples/start.js",
      "examples/env/src/index.js",
      "*.js"
    ],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["examples/**/*.js"],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    rules: {
      "no-console": "off",
      "no-use-before-define": "error"
    }
  }
];
