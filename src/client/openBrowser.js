const childProcess = require("child_process");

module.exports = url => {
  let cmd;
  const args = [];

  if (process.platform === "darwin") {
    try {
      // Try our best to reuse existing tab
      // on OS X Google Chrome with AppleScript
      childProcess.execSync(
        `osascript openChrome.applescript "${encodeURI(url)}"`,
        {
          cwd: __dirname,
          stdio: "ignore"
        }
      );
      return true;
    } catch (err) {
      // Ignore errors.
    }
    cmd = "open";
  } else if (process.platform === "win32") {
    cmd = "cmd.exe";
    args.push("/c", "start", '""', "/b");
    url = url.replace(/&/g, "^&");
  } else {
    cmd = "xdg-open";
  }

  args.push(url);

  const browser = childProcess.spawn(cmd, args);
  browser.once("error", error => {
    throw new Error(error);
  });
  browser.once("close", code => {
    if (code > 0) {
      throw new Error("Exited with code " + code);
    }
  });
};
