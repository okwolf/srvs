import H1 from "./components/H1";
import actions from "./actions";
import html from "./html";
const { div, button } = html;

export default state =>
  div(
    H1(state.count),
    button({ onclick: [actions.down, 1] }, "-"),
    button({ onclick: [actions.up, 1] }, "+")
  );
