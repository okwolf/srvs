import html from "../html";
const { div, h1, span, button } = html;

export const state = {
  count: 0
};

const Down = state => ({ ...state, count: state.count - 1 });
const Up = state => ({ ...state, count: state.count + 1 });

export const view = ({ count }) =>
  div(
    { class: "counter" },
    h1(count),
    span(
      button({ disabled: count <= 0, onclick: Down }, "–"),
      button({ onclick: Up }, "+")
    )
  );
