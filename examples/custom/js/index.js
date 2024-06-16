import { createElement, render } from "preact";
import { useState } from "preact/hooks";
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

render(html`<${Counter} />`, document.body);
