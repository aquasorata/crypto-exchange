import { Order, OrderStatus, OrderType, Prisma } from '@prisma/client'
import Decimal from "decimal.js";

export const findByClientOrderId = (
  tx: Prisma.TransactionClient,
  clientOrderId: string
): Promise<Order | null> => {
  return tx.order.findUnique({
    where: { clientOrderId }
  })
}

export const findOrderById = (
  tx: Prisma.TransactionClient,
  orderId: bigint
) => {
  return tx.order.findUnique({
    where: { id: orderId },
    include: {
      currency: true,
      buyTrades: true,
      sellTrades: true,
    },
  });
}

export const createOrder = (
  tx: Prisma.TransactionClient,
  data: {
    clientOrderId: string
    userId: bigint
    currencyId: bigint
    orderType: OrderType
    price: Decimal
    amount: Decimal
    remainingAmount: Decimal
    status: OrderStatus
    lockedWalletId: bigint
    lockedAmount: Decimal
  }
): Promise<Order> => {
  return tx.order.create({
    data: {
      clientOrderId: data.clientOrderId,
      userId: data.userId,
      currencyId: data.currencyId,
      orderType: data.orderType,
      price: data.price.toString(),
      amount: data.amount.toString(),
      remainingAmount: data.remainingAmount.toString(),
      status: 'OPEN',
      lockedWalletId: data.lockedWalletId,
      lockedAmount: data.lockedAmount.toString(),
    }
  })
}

export const findOpenOrderForUpdate = async (
  tx: Prisma.TransactionClient,
  orderId: bigint
) => {
  const [order] = await tx.$queryRaw<Order[]>`
    SELECT *
    FROM "Order"
    WHERE "id" = ${orderId}
      AND "status" = 'OPEN'
    FOR UPDATE
  `
  return order
}

export const findOppositeOrdersForUpdate = async (
  tx: Prisma.TransactionClient,
  currencyId: bigint,
  oppositeType: string,
  priceOperator: Prisma.Sql,
  price: Decimal,
  userId: bigint,
  priceSort: Prisma.Sql
) => {
  return tx.$queryRaw<Order[]>`
    SELECT *
    FROM "Order"
    WHERE "currencyId" = ${currencyId}
      AND "orderType" = ${oppositeType}
      AND "status" = 'OPEN'
      AND "price" ${priceOperator} ${price}
      AND "userId" != ${userId}
    ORDER BY "price" ${priceSort}, "createdAt" ASC
    FOR UPDATE
  `
}

export const decreaseOrderRemaining = async (
  tx: Prisma.TransactionClient,
  orderId: bigint,
  tradeAmount: string
) => {
  const [updated] = await tx.$queryRaw<Order[]>`
    UPDATE "Order"
    SET "remainingAmount" = "remainingAmount" - ${tradeAmount}
    WHERE "id" = ${orderId}
      AND "remainingAmount" >= ${tradeAmount}
    RETURNING "remainingAmount"
  `
  return updated
}

export const updateOrderStatus = async (
  tx: Prisma.TransactionClient,
  orderId: bigint,
  remainingAmount: string,
  status: "OPEN" | "MATCHED"
) => {
  return tx.order.update({
    where: { id: orderId },
    data: {
      remainingAmount,
      status,
    },
  })
}