import pino from "pino";
import { env } from "./env.js";

export function createLogger(service) {
  return pino({
    level: env.LOG_LEVEL,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: env.isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "[{service}] {msg}",
          },
        }
      : undefined,
  });
}

export const logger = createLogger("shared");
