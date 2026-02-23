import { Prisma, TransactionDirection, TransactionType } from "@prisma/client"

export const createTransactions = async (
  tx: Prisma.TransactionClient,
  data: {
    userId: bigint,
    currencyId: bigint,
    type: TransactionType,
    direction: TransactionDirection,
    amount: string
    referenceId?: bigint
  }[]
) => {
  return tx.transaction.createMany({ data })
}