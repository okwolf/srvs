import { app, text } from "hyperapp";
import H1 from "./components/H1";

const state = {
  message: "hello world"
};

const view = ({ message }) => H1({}, text(message));

app({ init: state, view, node: document.getElementById("app") });
