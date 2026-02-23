import { Prisma } from '@prisma/client';
import { decreaseOrderRemaining, findOpenOrderForUpdate, findOppositeOrdersForUpdate, updateOrderStatus } from "./order.repository";
import Decimal from "decimal.js";
import { lockWalletsForTrade } from "../wallet/wallet.repository";
import { TradeService } from "../trade/trade.service";
import { AppError } from "../../shared/errors";
import { toDecimal } from '../../shared/decimal';
import { MatchOrderResult } from './order.types';

const tradeService = new TradeService();

export const matchOrder = async (
  tx: Prisma.TransactionClient, 
  orderId: bigint
): Promise<MatchOrderResult> => {
  const lockedOrder = await findOpenOrderForUpdate(tx, orderId)
  if (!lockedOrder) throw new AppError(404, "Order not found or not open");
  let remaining = toDecimal(lockedOrder.remainingAmount);
  if (remaining.lte(0)) {
    return {
      order: lockedOrder,
      trades: [],
      summary: {
        matchedAmount: "0",
        remainingAmount: lockedOrder.remainingAmount.toString(),
        totalValue: "0"
      }
    };
  };
  const oppositeType = lockedOrder.orderType === "BUY" ? "SELL" : "BUY";

  const priceOperator =
    lockedOrder.orderType === "BUY"
      ? Prisma.sql`<=`
      : Prisma.sql`>=`;
  const priceSort =
    lockedOrder.orderType === "BUY"
      ? Prisma.sql`ASC`
      : Prisma.sql`DESC`;
  const oppositeOrders = await findOppositeOrdersForUpdate(
    tx,
    lockedOrder.currencyId,
    oppositeType,
    priceOperator,
    lockedOrder.price,
    lockedOrder.userId,
    priceSort
  )

  const executedTrades = [];
  let totalMatchedValue = new Decimal(0);

  for (const opposite of oppositeOrders) {
    if (remaining.lte(0)) break;
    if (opposite.id === lockedOrder.id) continue;

    const freshOppositeRemaining = toDecimal(opposite.remainingAmount);
    if (freshOppositeRemaining.lte(0)) continue;

    const tradeAmount = Decimal.min(remaining, freshOppositeRemaining);
    if (tradeAmount.lte(0)) continue;
    const tradePrice = toDecimal(opposite.price); 
    const tradeValue = tradeAmount.mul(tradePrice);

    await lockWalletsForTrade(
      tx,
      lockedOrder.userId,
      opposite.userId,
      lockedOrder.currencyId
    )
    
    const updatedOpposite = await decreaseOrderRemaining(
      tx,
      opposite.id,
      tradeAmount.toString()
    )
    if (!updatedOpposite) throw new AppError(409, "Opposite order changed during matching");
    const newRemaining = toDecimal(updatedOpposite.remainingAmount);
    if (newRemaining.lte(0)) {
      await updateOrderStatus(
        tx,
        opposite.id,
        "0",
        "MATCHED"
      )
    }

    const trade = await tradeService.updateWalletsForTrade(
      tx,
      lockedOrder,
      opposite,
      tradeAmount,
      tradeValue
    );

    executedTrades.push(trade);
    totalMatchedValue = totalMatchedValue.plus(tradeValue);

    remaining = remaining.minus(tradeAmount);
  }
  const order = await updateOrderStatus(
    tx,
    lockedOrder.id,
    remaining.toString(),
    remaining.lte(0) ? "MATCHED" : "OPEN"
  )

  const originalAmount = toDecimal(lockedOrder.amount);
  const matchedAmount = originalAmount.minus(remaining);

  return {
    order: order,
    trades: executedTrades,
    summary: {
      matchedAmount: matchedAmount.toString(),
      remainingAmount: remaining.toString(),
      totalValue: totalMatchedValue.toString()
    }
  }
}