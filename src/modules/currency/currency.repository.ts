import { Prisma } from '@prisma/client'

export const findCurrency = (
  tx: Prisma.TransactionClient,
  currencyId: bigint
) => {
  return tx.currency.findUnique({
    where: { id: currencyId },
    select: {
      type: true
    }
  });
}