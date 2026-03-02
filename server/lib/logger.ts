const isDev = process.env.NODE_ENV !== "production";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, msg: string, payload?: LogPayload): string {
  const timestamp = new Date().toISOString();
  const data = payload ? ` ${JSON.stringify(payload)}` : "";
  
  if (isDev) {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    return `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} ${msg}${data}`;
  }

  // Structured JSON for production log aggregators
  return JSON.stringify({ level, timestamp, msg, ...payload });
}

export const logger = {
  debug(msg: string, payload?: LogPayload) {
    if (isDev) console.debug(formatMessage("debug", msg, payload));
  },
  info(msg: string, payload?: LogPayload) {
    console.log(formatMessage("info", msg, payload));
  },
  warn(msg: string, payload?: LogPayload) {
    console.warn(formatMessage("warn", msg, payload));
  },
  error(msg: string, payload?: LogPayload) {
    console.error(formatMessage("error", msg, payload));
  },
};
