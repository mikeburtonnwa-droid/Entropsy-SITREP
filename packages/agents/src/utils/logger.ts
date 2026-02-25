import pino from "pino";
import { env } from "../config.js";

export const logger = pino({
  level: env.logLevel,
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export function childLogger(name: string) {
  return logger.child({ agent: name });
}
