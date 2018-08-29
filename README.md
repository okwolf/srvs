# `srvs` serves modern webapps for dev, with none of the fat

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

Keep in mind that in order to use `npx` with `Node.js < 8` you need to either install `npx` globally:

```console
npm i -g npx
```

or update your version of `npm`:

```console
npm i -g npm
```

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

| Argument   | Usage                                                                                  | Default |
| ---------- | -------------------------------------------------------------------------------------- | ------- |
| port       | The port on which the dev server will listen.                                          | 8080    |
| docRoot    | The relative path from which static assets such as `index.html` will be served.        | public  |
| scriptRoot | The relative path from which local JavaScript modules will be served.                  | src     |
| hot        | Watches for changes in your script files. Listen in your app with `module.hot.accept`. | false   |

Each argument is passed in the form `--argument=value`. Here is an example using all available arguments:

```console
npx srvs --port=3000 --root=~/myapp --docRoot=static --scriptRoot=js --hot
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
