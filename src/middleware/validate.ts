import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  <T>(schema: z.ZodType<T>) =>
  (req: Request<{}, {}, T>, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };