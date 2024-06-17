import { h, text } from "hyperapp";

const mapChildren = child =>
  typeof child === "string" || typeof child === "number"
    ? text(child)
    : Array.isArray(child)
      ? child.flatMap(mapChildren)
      : child;

export default new Proxy(
  {},
  {
    get:
      (_, tag) =>
      (...args) =>
        typeof args[0] === "object" &&
        !Array.isArray(args[0]) &&
        typeof args[0].props !== "object"
          ? h(tag, args[0], args.slice(1).flatMap(mapChildren))
          : h(tag, {}, args.flatMap(mapChildren))
  }
);
