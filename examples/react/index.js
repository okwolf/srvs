import { React, ReactDOM } from "es-react";
import htm from "htm";
const html = htm.bind(React.createElement);

ReactDOM.render(
  html`
    <main>
      <h1>Hello from es-react</h1>
    </main>
  `,
  document.body
);
