import { Request, Response, NextFunction } from "express";
import * as adminService from "./admin.service";
import { successResponse } from "../../shared/response";
import { serializeBigInt } from "../../shared/utils/serializer";

export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await adminService.getOverview();
    return res.status(200).json(
      successResponse(
        serializeBigInt(data), "Overview retrieved successfully"
      )
    )
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;

    const data = await adminService.getTransactions(limit, page);
    return res.status(200).json(
      successResponse(
        serializeBigInt(data), "Transactions retrieved successfully"
      )
    )
  } catch (err) {
    next(err);
  }
};

export const getVolumeByCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await adminService.getVolumeByCurrency();
    return res.status(200).json(
      successResponse(
        serializeBigInt(data), "Volume by currency retrieved successfully"
      )
    )
  } catch (err) {
    next(err);
  }
};

export const getSystemHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await adminService.getSystemHealth();
    return res.status(200).json(
      successResponse(
        serializeBigInt(data), "System health status retrieved successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};