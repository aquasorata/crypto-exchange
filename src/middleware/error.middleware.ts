import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors";
import { logger } from "../shared/logger";
import { ZodError } from "zod";

const sanitizeBody = (body: any) => {
  if (!body || typeof body !== "object") return body;

  const cloned = { ...body };

  if (cloned.password) cloned.password = "***";
  if (cloned.token) cloned.token = "***";
  if (cloned.refreshToken) cloned.refreshToken = "***";

  return cloned;
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const baseLog = {
    path: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id ?? null,
    body: sanitizeBody(req.body),
  };

  if (err instanceof ZodError) {
    const formatted = err.flatten();

    logger.warn({
      type: "ValidationError",
      ...baseLog,
      errors: formatted.fieldErrors,
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted.fieldErrors,
    });
  }

  if (err instanceof AppError) {
    logger.warn({
      type: "AppError",
      ...baseLog,
      message: err.message,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error({
    type: "InternalServerError",
    ...baseLog,
    message: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}