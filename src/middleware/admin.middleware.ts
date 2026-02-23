import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors";

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    throw new AppError(403, "Forbidden");
  }
  next();
};