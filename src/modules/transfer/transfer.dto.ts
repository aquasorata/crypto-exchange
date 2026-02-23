import { ExternalTransfer } from "@prisma/client"
import { InternalTransferResult } from "./transfer.types"
import { toIso } from "../../shared/utils/serializer"

export interface InternalTransferResponseDto {
  transfer: {
    id: string
    fromUserId: string
    toUserId: string
    currencyId: string
    amount: string
    createdAt: Date
  }
  sender: {
    walletId: string
    balance: string
  }
  receiver: {
    walletId: string
    balance: string
  }
}

export const toInternalTransferResponseDto = (
  data: InternalTransferResult
): InternalTransferResponseDto => {
  const { transfer, sender, receiver } = data

  return {
    transfer: {
      id: transfer.id.toString(),
      fromUserId: transfer.fromUserId.toString(),
      toUserId: transfer.toUserId.toString(),
      currencyId: transfer.currencyId.toString(),
      amount: transfer.amount.toString(),
      createdAt: transfer.createdAt,
    },
    sender: {
      walletId: sender.id.toString(),
      balance: sender.balance.toString(),
    },
    receiver: {
      walletId: receiver.id.toString(),
      balance: receiver.balance.toString(),
    },
  }
}

export interface ExternalTransferResponseDto {
  id: bigint;
  currencyId: bigint;
  amount: string;
  toAddress: string;
  status: string;
  createdAt: string;
}

export const toExternalTransferResponseDto = (
  transfer: ExternalTransfer
): ExternalTransferResponseDto => ({
  id: transfer.id,
  currencyId: transfer.currencyId,
  amount: transfer.amount.toString(),
  toAddress: transfer.toAddress,
  status: transfer.status,
  createdAt: toIso(transfer.createdAt)
});