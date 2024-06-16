import { app } from "hyperapp";
import view from "./view";
import * as counter from "./counter";

app({ init: { ...counter.state }, view, node: document.getElementById("app") });
