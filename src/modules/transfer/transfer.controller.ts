import { AppError } from "../../shared/errors";
import { successResponse } from "../../shared/response";
import { serializeBigInt } from "../../shared/utils/serializer";
import { toExternalTransferResponseDto, toInternalTransferResponseDto } from "./transfer.dto";
import { externalTransferSchema, internalTransferSchema } from "./transfer.schema";
import { TransferService } from "./transfer.service";
import { NextFunction, Request, Response } from "express";

export class TransferController {
  constructor(private transferService: TransferService) {}

  internalTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const parsed = internalTransferSchema.parse(req.body);
      const internalTransfer = await this.transferService.internalTransfer(
        req.user?.id,
        parsed,
      );
      return res.status(201).json(
        successResponse(
          toInternalTransferResponseDto(internalTransfer), "Transfer successful"
        )
      )
    } catch (err) {
      next(err)
    }
  }

  externalTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const parsed = externalTransferSchema.parse(req.body);
      const externalTransfer = await this.transferService.externalTransfer(
        req.user.id,
        parsed
      );
      return  res.status(201).json(
        successResponse(
          toExternalTransferResponseDto(serializeBigInt(externalTransfer)), "External transfer successful"
        )
      )
    } catch (err) {
      next(err)
    }
  }
}
