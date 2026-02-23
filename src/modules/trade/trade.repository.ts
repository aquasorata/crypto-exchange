import { Prisma } from "@prisma/client"

export const createTrade = async (
  tx: Prisma.TransactionClient,
  data: any
) => {
  return tx.trade.create({
    data,
  })
}