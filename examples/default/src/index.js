import { app } from "hyperapp";
import H1 from "./components/H1";

const state = {
  message: "hello world"
};

const actions = {};

const view = ({ message }) => H1({}, message);

app(state, actions, view, document.body);
