import { Order, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { toDecimal } from "../../shared/decimal";
import { AppError } from "../../shared/errors";
import { decrementLockedBalance, incrementBalance, incrementSystemBalance, refundLockedToBalance, settleBuyerFiatForTrade } from "../wallet/wallet.repository";
import { createTransactions } from "../transaction/transaction.repository";
import { createTrade } from "./trade.repository";

export class TradeService{
  // -------------------------
  // updateWalletsForTrade
  // -------------------------
  async updateWalletsForTrade(
    tx: Prisma.TransactionClient,
    incomingOrder: Order,
    bookOrder: Order,
    tradeAmount: Decimal,
    tradeValue: Decimal
  ) {
    const SYSTEM_USER_ID = BigInt(1);
    const fiatId = BigInt(4); // THB
    const cryptoId = incomingOrder.currencyId;

    const isIncomingBuy = incomingOrder.orderType === "BUY";

    const buyerOrder = isIncomingBuy ? incomingOrder : bookOrder;
    const sellerOrder = isIncomingBuy ? bookOrder : incomingOrder;

    const buyerId = buyerOrder.userId;
    const sellerId = sellerOrder.userId;

    const takerOrder = incomingOrder;
    const makerOrder = bookOrder;

    const takerFeeRate = new Decimal(0.002); // 0.02%
    const makerFeeRate = new Decimal(0.001); // 0.01%

    const buyerIsTaker = buyerOrder.id === takerOrder.id;

    const buyerFeeRate = buyerIsTaker ? takerFeeRate : makerFeeRate;
    const sellerFeeRate = buyerIsTaker ? makerFeeRate : takerFeeRate;

    const buyerFee = tradeAmount.mul(buyerFeeRate);
    const sellerFee = tradeValue.mul(sellerFeeRate);

    const buyerReceiveCrypto = tradeAmount.minus(buyerFee);
    const sellerReceiveFiat = tradeValue.minus(sellerFee);

    if (buyerReceiveCrypto.lt(0) || sellerReceiveFiat.lt(0)) throw new AppError(500, "Invalid fee calculation");

    const executionPrice = tradeValue.div(tradeAmount);
    const buyerLimitPrice = toDecimal(buyerOrder.price);
    // -------------------------
    // BUYER
    // -------------------------
    const priceDiff = buyerLimitPrice.minus(executionPrice);
    const refundAmount = priceDiff.gt(0)
      ? priceDiff.mul(tradeAmount)
      : new Decimal(0);

    const buyerFiatUpdate = await settleBuyerFiatForTrade(
      tx,
      buyerId,
      fiatId,
      tradeValue.toString(),
      refundAmount.toString()
    );
    if (buyerFiatUpdate.count !== 1) throw new AppError(409, "Buyer locked fiat changed");
  
    const buyerCryptoUpdate = await incrementBalance(
      tx, 
      buyerId, 
      cryptoId, 
      buyerReceiveCrypto.toString()
    );
    if (buyerCryptoUpdate.count !== 1) throw new AppError(409, "Buyer crypto wallet missing");
    // -------------------------
    // REFUND
    // -------------------------
    if (refundAmount.gt(0)) {
      await createTransactions(tx, [{
        userId: buyerId,
        currencyId: fiatId,
        type: "TRADE",
        direction: "CREDIT",
        amount: refundAmount.toString(),
      }]);
    }
    // -------------------------
    // SELLER
    // -------------------------
    const sellerCryptoUpdate = await decrementLockedBalance(
      tx, sellerId, cryptoId, tradeAmount.toString()
    );
    if (sellerCryptoUpdate.count !== 1) throw new AppError(409, "Seller locked crypto changed");
  
    const sellerFiatUpdate = await incrementBalance(
      tx, sellerId, fiatId, sellerReceiveFiat.toString()
    );
    if (sellerFiatUpdate.count !== 1) throw new AppError(409, "Seller fiat wallet missing");
    // -------------------------
    // PLATFORM FEE
    // -------------------------
    if (buyerFee.gt(0)) {
      await incrementSystemBalance(
        tx, SYSTEM_USER_ID, cryptoId, buyerFee.toString()
      );
    }
    if (sellerFee.gt(0)) {
      await incrementSystemBalance(
        tx, SYSTEM_USER_ID, fiatId, sellerFee.toString()
      );
    }
    // -------------------------
    // CREATE TRADE
    // -------------------------
    const trade = await createTrade(tx, {
      currencyId: cryptoId,
      buyOrderId: buyerOrder.id,
      sellOrderId: sellerOrder.id,
      takerOrderId: takerOrder.id,
      makerOrderId: makerOrder.id,
      price: executionPrice.toString(),
      amount: tradeAmount.toString(),
      value: tradeValue.toString(),
      buyerFee: buyerFee.toString(),
      sellerFee: sellerFee.toString(),
      buyerFeeRate: buyerFeeRate.toString(),
      sellerFeeRate: sellerFeeRate.toString(),
    });
    // -------------------------
    // LEDGER
    // -------------------------
    await createTransactions(tx, [
      {
        userId: buyerId,
        currencyId: fiatId,
        type: "TRADE",
        direction: "DEBIT",
        amount: tradeValue.toString(),
        referenceId: trade.id,
      },
      {
        userId: buyerId,
        currencyId: cryptoId,
        type: "TRADE",
        direction: "CREDIT",
        amount: buyerReceiveCrypto.toString(),
        referenceId: trade.id,
      },
      {
        userId: sellerId,
        currencyId: cryptoId,
        type: "TRADE",
        direction: "DEBIT",
        amount: tradeAmount.toString(),
        referenceId: trade.id,
      },
      {
        userId: sellerId,
        currencyId: fiatId,
        type: "TRADE",
        direction: "CREDIT",
        amount: sellerReceiveFiat.toString(),
        referenceId: trade.id,
      },
      {
        userId: SYSTEM_USER_ID,
        currencyId: cryptoId,
        type: "FEE",
        direction: "CREDIT",
        amount: buyerFee.toString(),
        referenceId: trade.id,
      },
      {
        userId: SYSTEM_USER_ID,
        currencyId: fiatId,
        type: "FEE",
        direction: "CREDIT",
        amount: sellerFee.toString(),
        referenceId: trade.id,
      }
    ]);
    return trade;
  }
}