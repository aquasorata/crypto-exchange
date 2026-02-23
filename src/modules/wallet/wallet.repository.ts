import { Prisma, Wallet } from "@prisma/client"
import Decimal from "decimal.js"

export const findWallet = (
  tx: Prisma.TransactionClient,
  userId: bigint,
  currencyId: bigint
): Promise<Wallet | null> => {
  return tx.wallet.findUnique({
    where: {
      userId_currencyId: {
        userId,
        currencyId
      }
    }
  })
}

export const lockWalletBalance = (
  tx: Prisma.TransactionClient,
  walletId: bigint,
  amount: Decimal
) => {
  return tx.wallet.updateMany({
    where: {
      id: walletId,
      balance: { gte: amount.toString() }
    },
    data: {
      balance: { decrement: amount.toString() },
      lockedBalance: { increment: amount.toString() }
    }
  })
}

export const lockWalletsForTrade = async (
  tx: Prisma.TransactionClient,
  lockedOrderUserId: bigint,
  oppositeUserId: bigint,
  currencyId: bigint
) => {
  await tx.$queryRaw`
    SELECT *
    FROM "Wallet"
    WHERE
      ("userId" = ${lockedOrderUserId}
        AND "currencyId" IN (${currencyId}, 4))
      OR
      ("userId" = ${oppositeUserId}
        AND "currencyId" IN (${currencyId}, 4))
    FOR UPDATE
  `
}

export const decrementLockedBalance = async (
  tx: Prisma.TransactionClient,
  userId: bigint,
  currencyId: bigint,
  amount: string
) => {
  return tx.wallet.updateMany({
    where: {
      userId,
      currencyId,
      lockedBalance: { gte: amount }
    },
    data: {
      lockedBalance: { decrement: amount }
    }
  })
}

export const incrementBalance = async (
  tx: Prisma.TransactionClient,
  userId: bigint,
  currencyId: bigint,
  amount: string
) => {
  return tx.wallet.updateMany({
    where: {
      userId,
      currencyId
    },
    data: {
      balance: { increment: amount }
    }
  })
}

export const refundLockedToBalance = async (
  tx: Prisma.TransactionClient,
  userId: bigint,
  currencyId: bigint,
  amount: string
) => {
  return tx.wallet.updateMany({
    where: {
      userId,
      currencyId,
      lockedBalance: { gte: amount }
    },
    data: {
      balance: { increment: amount },
      lockedBalance: { decrement: amount }
    }
  })
}

export const incrementSystemBalance = async (
  tx: Prisma.TransactionClient,
  systemUserId: bigint,
  currencyId: bigint,
  amount: string
) => {
  return tx.wallet.update({
    where: {
      userId_currencyId: {
        userId: systemUserId,
        currencyId
      }
    },
    data: {
      balance: { increment: amount }
    }
  })
}