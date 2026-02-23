import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

function safeStringify(value: any) {
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === "bigint") {
        return val.toString();
      }

      if (val?.constructor?.name === "Decimal") {
        return val.toString();
      }

      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }

      return val;
    },
    2
  );
}

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let base: string;

  if (typeof stack === "string") {
    base = stack;
  } else if (typeof message === "object") {
    base = safeStringify(message);
  } else {
    base = String(message);
  }

  const metaString =
    Object.keys(meta).length > 0
      ? ` ${safeStringify(meta)}`
      : "";

  return `${timestamp} [${level}] ${base}${metaString}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        errors({ stack: true }),
        logFormat
      ),
    }),

    new DailyRotateFile({
      dirname: "logs",
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      zippedArchive: true,
    }),

    new DailyRotateFile({
      dirname: "logs",
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      zippedArchive: true,
    }),
  ],
});