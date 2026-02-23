import { OrderStatus } from "@prisma/client";
import { CancelOrderResult, CreateOrderResult } from "./order.types";
import { toIso } from "../../shared/utils/serializer";

export interface OrderDto {
  id: string;
  clientOrderId: string;
  orderType: "BUY" | "SELL";
  price: string;
  amount: string;
  remainingAmount: string;
  status: OrderStatus;
  createdAt: string;
}

export interface TradeDto {
  id: string;
  price: string;
  amount: string;
  createdAt: string;
}

export interface MatchSummaryDto {
  matchedAmount: string;
  remainingAmount: string;
  totalValue: string;
}

export interface CreateOrderResponseDto {
  order: OrderDto;
  trades: TradeDto[];
  summary: MatchSummaryDto;
  idempotent?: boolean;
}

  export const toCreateOrderResponseDto = (
    result: CreateOrderResult
  ): CreateOrderResponseDto => {
    const response: CreateOrderResponseDto = {
      order: {
        id: result.order.id.toString(),
        clientOrderId: result.order.clientOrderId,
        orderType: result.order.orderType,
        price: result.order.price.toString(),
        amount: result.order.amount.toString(),
        remainingAmount: result.order.remainingAmount.toString(),
        status: result.order.status,
        createdAt: toIso(result.order.createdAt),
      },
      trades: result.trades.map((trade) => ({
        id: trade.id.toString(),
        price: trade.price.toString(),
        amount: trade.amount.toString(),
        createdAt: toIso(trade.createdAt),
      })),
      summary: {
        matchedAmount: result.summary.matchedAmount.toString(),
        remainingAmount: result.summary.remainingAmount.toString(),
        totalValue: result.summary.totalValue.toString(),
      },
    };

  if (result.idempotent) {
    response.idempotent = true;
  }

  return response;
};

export interface CancelOrderResponseDto {
  order: {
    id: string;
    status: string;
    remainingAmount: string;
    cancelledAt: string;
  };
  refund: {
    currency: string;
    balance: string;
  };
  wallet: {
    id: string;
    balance: string;
    lockedBalance: string;
  };
}

export const toCancelOrderResponseDto = (
  result: CancelOrderResult
): CancelOrderResponseDto => {
  return {
    order: {
      id: result.order.id.toString(),
      status: result.order.status,
      remainingAmount: result.order.remainingAmount.toString(),
      cancelledAt: toIso(result.order.cancelledAt),
    },
    refund: {
      currency: result.refund.currency,
      balance: result.refund.balance.toString(),
    },
    wallet: {
      id: result.wallet.id.toString(),
      balance: result.wallet.balance.toString(),
      lockedBalance: result.wallet.lockedBalance.toString(),
    },
  };
};