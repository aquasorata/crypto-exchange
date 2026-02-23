import { InternalTransfer, Wallet } from "@prisma/client";
import Decimal from "decimal.js";

export interface InternalTransferInput {
  toUserId: bigint;
  currencyId: bigint;
  amount: string;
}

export interface InternalTransferResult {
  transfer: InternalTransfer
  sender: Wallet
  receiver: Wallet
}

export interface ExternalTransferInput {
  currencyId: bigint;
  toAddress: string;
  amount: Decimal;
}