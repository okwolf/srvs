import { app } from "hyperapp";
import H1 from "./components/H1";

const state = {
  message: "hello world"
};

const view = ({ message }) => H1({}, message);

app({ init: () => state, view, node: document.body });
