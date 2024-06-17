import { app } from "hyperapp";
import { Random } from "hyperapp-fx";
import html from "./html";
const { main, h1, button } = html;

const RollDie = state => [
  state,
  Random({
    min: 1,
    max: 6,
    int: true,
    action: (_, roll) => roll
  })
];

app({
  init: RollDie,
  view: dieValue =>
    main(
      h1(dieValue),
      button(
        {
          onclick: RollDie
        },
        "Roll"
      )
    ),
  node: document.getElementById("app")
});
