const withColor = color => message => `\x1b[1;${color}m${message}\x1b[0m`;

module.exports = {
  withRed: withColor(31),
  withGreen: withColor(32),
  withYellow: withColor(33),
  withCyan: withColor(36),
  withWhite: withColor(37)
};
