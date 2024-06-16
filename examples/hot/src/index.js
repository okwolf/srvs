import { app } from "hyperapp";
import state from "./state";
import view from "./view";

const node = document.getElementById("app");

if (!node.__$$DISPATCH) {
  node.__$$DISPATCH = app({
    init: state,
    view,
    node
  });
}

if (import.meta.hot) {
  import.meta.hot.accept((path, getUpdated) => {
    if (path !== "./state.js") {
      if (path.endsWith(".css")) {
        for (const link of document.querySelectorAll("link")) {
          if (link.getAttribute("href") === path) {
            link.remove();
          }
        }
        const newLink = document.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = path;
        document.body.appendChild(newLink);
      } else {
        getUpdated().then(({ app, view }) => {
          let currentState;
          node.__$$DISPATCH(state => {
            currentState = state;
          });
          node.__$$DISPATCH = app({
            init: currentState,
            view,
            node
          });
        });
      }

      return true;
    }
  });

  import.meta.hot.data = import.meta.hot.data ? import.meta.hot.data + 1 : 1;
  console.log("hmr count", import.meta.hot.data);
  import.meta.hot.dispose(() => {
    console.log("cleanup logic go here");
  });
}

export { app, view };
