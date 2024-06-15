const withColor = color => message => `\x1b[1;${color}m${message}\x1b[0m`;

export const withRed = withColor(31);
export const withGreen = withColor(32);
export const withYellow = withColor(33);
export const withCyan = withColor(36);
export const withWhite = withColor(37);
