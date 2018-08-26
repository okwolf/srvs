import { app } from "hyperapp";
import moisturize from "hyperapp-moisturize";
import state from "./state";
import actions from "./actions";
import view from "./view";
import makeHotReloader from "./makeHotReloader";

const main = moisturize(app)(state, actions, view, document.body);

const hotReloader = makeHotReloader(main.updateApp);
hotReloader("state.js", "newState");
hotReloader("actions.js", "newActions");
hotReloader("view.js", "newView");
