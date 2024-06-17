import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import htm from "htm";
const html = htm.bind(createElement);

const Counter = () => {
  const [count, setCount] = useState(0);
  return html`
    <div>
      <p>Count: ${count}</p>
      <button onClick=${() => setCount(count + 1)}>Increment</button>
      <button onClick=${() => setCount(count - 1)}>Decrement</button>
    </div>
  `;
};

const root = createRoot(document.getElementById("app"));
root.render(html`<${Counter} />`);
