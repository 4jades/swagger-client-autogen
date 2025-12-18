const colors = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
};

export const log = {
  error: (...args: Parameters<typeof console.error>) => console.error(colors.red('[🚨 ERROR]'), ...args),
  info: (...args: Parameters<typeof console.info>) => console.info(colors.blue('[ℹ️ INFO]'), ...args),
  warn: (...args: Parameters<typeof console.warn>) => console.warn(colors.yellow('[⚠️ WARN]'), ...args),
  success: (...args: Parameters<typeof console.log>) => console.log(colors.green('[SUCCESS]'), ...args),
  log: (...args: Parameters<typeof console.log>) => console.log(...args),
};
