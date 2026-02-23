import { prisma } from "../../shared/prisma";
import { Prisma } from '@prisma/client';
import { AppError } from "../../shared/errors";
import { createOrder, findOpenOrderForUpdate, findOrderById } from "./order.repository";
import { CancelOrderInput, CreateOrderInput } from "./order.schema";
import { withTransactionRetry } from "../../shared/retry";
import { findCurrency } from "../currency/currency.repository";
import { findWallet, lockWalletBalance } from "../wallet/wallet.repository";
import { toDecimal } from "../../shared/decimal";
import { matchOrder } from "./matching.service";
import { CancelOrderResult, CreateOrderResult } from "./order.types";

export class OrderService{
  // -------------------------
  // createOrder
  // -------------------------
  async createOrder(data: CreateOrderInput, userId: bigint): Promise<CreateOrderResult> {
    const { clientOrderId, currencyId, orderType, price, amount } = data;
    return withTransactionRetry(() =>
      prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({
          where: { clientOrderId }
        });

        if (existing) {
          return {
            order: existing,
            trades: [],
            summary: {
              matchedAmount: existing.amount.sub(existing.remainingAmount).toString(),
              remainingAmount: existing.remainingAmount.toString(),
              totalValue: "0"
            },
            idempotent: true
          };
        };

        const currency = await findCurrency(tx, currencyId);

        if (!currency) throw new AppError(404, "Currency not found");

        if (currency.type !== 'CRYPTO') throw new AppError(400, 'Only CRYPTO currencies can be traded');

        let wallet: { id: bigint } | null = null

        if (orderType === 'BUY') {
          const fiatCurrencyId = BigInt(4); // THB

          wallet = await findWallet(
            tx, 
            userId,
            fiatCurrencyId
          );

          if (!wallet) throw new AppError(404, 'Wallet not found');

          const required = price.mul(amount);

          const update = await lockWalletBalance(
            tx, 
            wallet.id, 
            required
          );

          if (update.count === 0) throw new AppError(400, 'Insufficient balance');
        } else {
          const wallet = await findWallet(
            tx,
            userId,
            currencyId
          );

          if (!wallet) throw new AppError(404, 'Wallet not found');

          const update = await lockWalletBalance(
            tx, 
            wallet.id, 
            amount
          );

          if (update.count === 0) throw new AppError(400, 'Insufficient balance');
        }

        if (!wallet) throw new AppError(404, 'Wallet not initialized')

        const required = orderType === 'BUY'
          ? price.mul(amount)
          : amount 

        const order = await createOrder(tx, {
          clientOrderId,
          userId,
          currencyId,
          orderType,
          price: price,
          amount: amount,
          remainingAmount: amount,
          status: 'OPEN',
          lockedWalletId: wallet.id,
          lockedAmount: required,
        });

        const resule = await matchOrder(tx, order.id)

        return resule;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    );
  }
  // -------------------------
  // cancelOrder
  // -------------------------
  async cancelOrder(data: CancelOrderInput, userId: bigint): Promise<CancelOrderResult> {
    const { orderId } = data;
    return withTransactionRetry(() =>
      prisma.$transaction(async (tx) => {
        const order = await findOpenOrderForUpdate(
          tx,
          orderId,
        )

        if (!order) throw new AppError(404, "Order not found");

        if (order.userId !== userId) throw new AppError(403, 'Not your order');

        const remaining = toDecimal(order.remainingAmount);

        if (remaining.lte(0)) throw new AppError(400, "Nothing to cancel");

        const wallet = await tx.wallet.findUnique({
          where: { id: order.lockedWalletId }
        });

        if (!wallet) throw new AppError(500, "Wallet not found")

        const refundAmount = toDecimal(order.lockedAmount)

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: refundAmount.toString() },
            lockedBalance: { decrement: refundAmount.toString() }
          }
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            remainingAmount: "0"
          },
          include: { 
            currency: true 
          }
        });
        
        await tx.transaction.create({
          data: {
            userId: order.userId,
            currencyId: wallet.currencyId,
            type: "REFUND",
            direction: "CREDIT",
            amount: refundAmount.toString(),
            referenceId: order.id
          }
        });

        return {
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            remainingAmount: updatedOrder.remainingAmount,
            cancelledAt: updatedOrder.updatedAt
          },
          refund: {
            currency: updatedOrder.currency.code,
            balance: refundAmount
          },
          wallet: {
            id: updatedWallet.id,
            balance: updatedWallet.balance,
            lockedBalance: updatedWallet.lockedBalance
          },
        }
      })
    );
  }
  // -------------------------
  // getOrderById 
  // -------------------------
  async getOrderById(
    userId: bigint,
    orderId: bigint
  ) {
    return withTransactionRetry(() =>
      prisma.$transaction(async (tx) => {
        const order = await findOrderById(tx, orderId);

        if (!order) throw new AppError(404, "Order not found");
 
        if (order.userId !== userId) throw new AppError(403, "You do not have access to this order");

        return order;
      })
    )
  }
  // -------------------------
  // getOrderBook 
  // -------------------------
  async getOrderBook(
    currencyId: bigint
  ) {
    const buyOrders = await prisma.order.groupBy({
      by: ["price"],
      where: {
        currencyId,
        orderType: "BUY",
        status: "OPEN",
        remainingAmount: {
          gt: 0
        }
      },
      _sum: {
        remainingAmount: true
      }
    });
  
    const sellOrders = await prisma.order.groupBy({
      by: ["price"],
      where: {
        currencyId,
        orderType: "SELL",
        status: "OPEN",
        remainingAmount: {
          gt: 0
        }
      },
      _sum: {
        remainingAmount: true
      }
    });
  
    const sortedBuy = buyOrders
      .map(order => ({
        price: toDecimal(order.price),
        amount: toDecimal(order._sum.remainingAmount || 0)
      }))
      .sort((a, b) => Number(b.price) - Number(a.price)); // DESC
  
    const sortedSell = sellOrders
      .map(order => ({
        price: toDecimal(order.price),
        amount: toDecimal(order._sum.remainingAmount || 0)
      }))
      .sort((a, b) => Number(a.price) - Number(b.price)); // ASC
  
    return {
      buy: sortedBuy,
      sell: sortedSell
    };
  }
}