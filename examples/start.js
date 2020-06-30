const path = require("path");
const { execSync } = require("child_process");

const name = process.argv[2] || "default";

execSync("npm start", {
  shell: true,
  stdio: "inherit",
  cwd: path.resolve(__dirname, name)
});
