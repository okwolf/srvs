import { app } from "hyperapp";
import H1 from "../components/H1";

export default () =>
  app({
    state: {
      message: "hello world"
    },
    view: ({ message }) => H1({}, message)
  });
