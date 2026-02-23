import { z } from "zod";
import { decimalSchema } from "../../shared/decimal";

export const internalTransferSchema = z.object({
  toUserId: z.coerce.bigint(),
  currencyId: z.coerce.bigint(),
  amount: z.string()
});

export const externalTransferSchema = z.object({
  currencyId: z.coerce.bigint(),
  toAddress: z.string().min(10),
  amount: decimalSchema
});