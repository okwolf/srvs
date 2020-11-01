document.body.innerHTML = `<code>process.env</code>: <pre>${JSON.stringify(
  process.env,
  null,
  2
)}</pre>`;
