const os = require("os");

module.exports = ({ port }) => {
  const interfaces = os.networkInterfaces();
  const urls = Object.keys(interfaces)
    .map(name => interfaces[name].find(({ family }) => family === "IPv4"))
    .filter(interface => interface)
    .map(({ address }) => `http://${address}:${port}`);
  return urls;
};
