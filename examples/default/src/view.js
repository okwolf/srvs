import * as counter from "./counter";
import html from "../html";
const { div, header, img, p, code, a } = html;

export default state =>
  div(
    { class: "App" },
    header(
      { class: "App-header" },
      img({ src: "./logo.svg", class: "App-logo", alt: "logo" }),
      p("Edit ", code("src/view.js"), " and save to reload."),
      a(
        {
          class: "App-link",
          href: "https://github.com/jorgebucaran/hyperapp",
          target: "_blank",
          rel: "noopener noreferrer"
        },
        "Learn Hyperapp"
      ),
      counter.view(state)
    )
  );
