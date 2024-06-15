import os from "os";

export default ({ port }) => {
  const interfaces = os.networkInterfaces();
  const urls = Object.keys(interfaces)
    .map(name => interfaces[name].find(({ family }) => family === "IPv4"))
    .filter(i => i)
    .map(({ address }) => `http://${address}:${port}`);
  return urls;
};
