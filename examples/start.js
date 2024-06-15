import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const name = process.argv[2] || "default";

execSync("npm start", {
  shell: true,
  stdio: "inherit",
  cwd: path.resolve(__dirname, name)
});
