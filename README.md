# `srvs` `s`e`rv`e`s` modern webapps for dev, with none of the fat

[![Build Status](https://travis-ci.org/okwolf/srvs.svg?branch=master)](https://travis-ci.org/okwolf/srvs)
[![codecov](https://codecov.io/gh/okwolf/srvs/branch/master/graph/badge.svg)](https://codecov.io/gh/okwolf/srvs)
[![npm](https://img.shields.io/npm/v/srvs.svg)](https://www.npmjs.org/package/srvs)

`srvs` is a zero dependency dev server with support for static content in addition to JavaScript modules hosted from local files and [unpkg.com](https://unpkg.com).

## Installation

### Global

```console
npm i -g srvs
```

Then you may run with:

```console
srvs
```

### `npx`

No install required, just run:

```console
npx srvs
```

([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher.)

### Local

Install with npm / Yarn:

```console
npm i -D srvs
```

Then add `srvs` to the `scripts` in your `package.json`:

```json
"scripts": {
  "start": "srvs"
}
```

Now you may run with:

```console
npm start
```

## Usage

### Command Line

Here are the available command line arguments:

| Argument   | Usage                                                                           | Default |
| ---------- | ------------------------------------------------------------------------------- | ------- |
| port       | The port on which the dev server will listen.                                   | 8080    |
| docRoot    | The relative path from which static assets such as `index.html` will be served. | public  |
| scriptRoot | The relative path from which local JavaScript modules will be served.           | src     |

Each argument is passed in the form `--argument=value`. Here is an example using all available arguments:

```console
npx srvs --port=3000 --docRoot=static --scriptRoot=js
```

### API

`srvs` offers a programmatic way to integrate running with existing JavaScript code.

You may bring in the `srvs` API function using `import` if you have support for ES6 syntax:

```js
import srvs from "srvs";

srvs(options).then(config => {
  // dev server is now open for business
});
```

Or using `require`:

```js
const srvs = require("srvs");

srvs(options).then(config => {
  // dev server is now open for business
});
```

The `options` object has the same properties and values as the arguments supported by the command line version. The `config` parameter provided to the resolved `Promise` has the same properties as `options`.

## Notes

- This is only for use as a development tool, please do not use in production.
- The `docRoot` and `scriptRoot` options will fall back to the current directory if they don't exist.
- If you intend to use [dynamic import](https://github.com/tc39/proposal-dynamic-import#import) (as the `examples/hot` project does) to hot reload changed modules, be aware this is [not supported by some browsers](https://caniuse.com/#feat=es6-module-dynamic-import).
- The `BROWSER` environment variable can be used to control which application to open your page in, or set to `none` to disable browser opening entirely. This feature is inspired by the popular [`create-react-app`](https://facebook.github.io/create-react-app/docs/advanced-configuration).

## License

`srvs` is MIT licensed. See [LICENSE](LICENSE.md).
