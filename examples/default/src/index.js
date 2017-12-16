import { app } from "hyperapp";
import H1 from "./components/H1";

app(
  {
    message: "hello world"
  },
  ({ message }) => H1({}, message),
  document.body
);
