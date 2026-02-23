import { NextFunction, Request, Response } from "express";
import { OrderService } from "./order.service";
import { cancelOrderSchema, createOrderSchema, getOrderBookSchema, getOrderByIdSchema } from "./order.schema";
import { successResponse } from "../../shared/response";
import { toCancelOrderResponseDto, toCreateOrderResponseDto } from "./order.dto";
import { serializeBigInt } from "../../shared/utils/serializer";
import { AppError } from "../../shared/errors";

export class OrderController {
  constructor(private orderService: OrderService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const parsed = createOrderSchema.parse(req.body);
      const order = await this.orderService.createOrder(parsed, req.user.id);
      return res.status(201).json(
        successResponse(
          toCreateOrderResponseDto(serializeBigInt(order)), "Order created successfully"
        )
      )
    } catch (err) {
      next(err);
    }
  }

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const parsed = cancelOrderSchema.parse(req.body);
      const cancel = await this.orderService.cancelOrder(parsed, req.user.id)
      return res.status(201).json(
        successResponse(
          toCancelOrderResponseDto(serializeBigInt(cancel)), "Order cancelled successfully"
        )
      )
    } catch (err) {
      next(err);
    }
  }

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const parsed = getOrderByIdSchema.parse(req.params);
      const order = await this.orderService.getOrderById(
        req.user.id,
        parsed.id
      );
      return res.status(200).json(
        successResponse(
          serializeBigInt(order), "Order retrieved successfully"
        )
      )
    } catch (err) {
      next(err)
    }
  }

  getOrderBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = getOrderBookSchema.parse(req.params);
      const order = await this.orderService.getOrderBook(parsed.currencyId);
      return res.status(200).json(
        successResponse(
          serializeBigInt(order), "Order book retrieved successfully"
        )
      )
    } catch (err) {
      next(err);
    }
  }
}