// Logger central con Pino
import pino from "pino";
import { env } from "../config/env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: (env as any).LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: { service: "canasta-backend" },
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "*.contrasena",
      "contrasena",
      "*.password",
      "password",
      "*.token",
      "token",
    ],
    censor: "[REDACTED]",
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,service",
          messageFormat: "{msg}",
        },
      }
    : undefined,
});
