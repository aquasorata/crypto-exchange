import { Order, Trade } from "@prisma/client";
import Decimal from "decimal.js";

export interface MatchSummary {
  matchedAmount: string;
  remainingAmount: string;
  totalValue: string;
}

export interface MatchOrderResult {
  order: Order;
  trades: Trade[];
  summary: MatchSummary;
}

export interface CreateOrderResult {
  order: Order;
  trades: Trade[];
  summary: MatchSummary;
  idempotent?: boolean;
}

export interface CancelOrderResult {
  order: {
    id: bigint;
    status: string;
    remainingAmount: Decimal;
    cancelledAt: Date;
  };
  refund: {
    currency: string;
    balance: Decimal;
  };
  wallet: {
    id: bigint;
    balance: Decimal;
    lockedBalance: Decimal;
  };
}