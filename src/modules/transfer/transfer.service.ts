import { toDecimal } from "../../shared/decimal";
import { AppError } from "../../shared/errors";
import { ExternalTransferInput, InternalTransferInput } from "./transfer.types";
import { prisma } from '../../shared/prisma';

export class TransferService{
  // -------------------------
  // internalTransfer
  // -------------------------
  async internalTransfer(
    fromUserId: bigint,
    payload: InternalTransferInput
  ) {
    const { toUserId, currencyId, amount } = payload;

    if (fromUserId === toUserId) throw new AppError(400, "Cannot transfer to yourself");

    const transferAmount = toDecimal(amount);

    if (transferAmount.lte(0)) throw new AppError(400, "Amount must be greater than 0");

    return prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({
        where: {
          userId_currencyId: {
            userId: fromUserId,
            currencyId
          }
        }
      });
  
      if (!senderWallet) throw new AppError(404, "Sender wallet not found");
  
      const senderBalance = toDecimal(senderWallet.balance);
  
      if (senderBalance.lt(transferAmount)) {
        throw new AppError(400, "Insufficient balance");
      }
  
      const receiverWallet = await tx.wallet.findUnique({
        where: {
          userId_currencyId: {
            userId: toUserId,
            currencyId
          }
        }
      });
  
      if (!receiverWallet) throw new AppError(404, "Receiver wallet not found");

      const updatedSenderWallet = await tx.wallet.updateMany({
        where: {
          userId: fromUserId,
          currencyId,
          balance: {
            gte: transferAmount.toString()
          }
        },
        data: {
          balance: {
            decrement: transferAmount.toString()
          }
        }
      });
      
      if (updatedSenderWallet.count === 0)  throw new AppError(400, "Insufficient balance");

      const updatedReceiverWallet = await tx.wallet.updateMany({
        where: {
          userId: toUserId,
          currencyId,
        },
        data: {
          balance: { increment: transferAmount.toString() }
        }
      });
      
      if (updatedReceiverWallet.count === 0)  throw new AppError(404, "Receiver wallet not found");
  
      const transfer = await tx.internalTransfer.create({
        data: {
          fromUserId,
          toUserId,
          currencyId,
          amount: transferAmount.toString()
        }
      });
  
      await tx.transaction.create({
        data: {
          userId: fromUserId,
          currencyId,
          type: "TRANSFER",
          direction: 'DEBIT',
          amount: transferAmount.negated().toString(),
          referenceId: transfer.id
        }
      });

      await tx.transaction.create({
        data: {
          userId: toUserId,
          currencyId,
          type: "TRANSFER",
          direction: 'CREDIT',
          amount: transferAmount.toString(),
          referenceId: transfer.id
        }
      });
  
      const [finalSenderWallet, finalReceiverWallet] = await Promise.all([
        tx.wallet.findUnique({
          where: {
            userId_currencyId: {
              userId: fromUserId,
              currencyId
            }
          }
        }),
        tx.wallet.findUnique({
          where: {
            userId_currencyId: {
              userId: toUserId,
              currencyId
            }
          }
        })
      ]);

      return {
        transfer: {
          id: transfer.id,
          fromUserId: transfer.fromUserId,
          toUserId: transfer.toUserId,
          currencyId: transfer.currencyId,
          amount: transfer.amount,
          createdAt: transfer.createdAt
        },
        sender: finalSenderWallet!,
        receiver: finalReceiverWallet!
      }
    });
  };
  // -------------------------
  // externalTransfer
  // -------------------------
  async externalTransfer(
    userId: bigint,
    payload: ExternalTransferInput  
  ) {
    const amount = toDecimal(payload.amount);

    if (amount.lte(0)) throw new AppError(400, "Amount must be greater than zero");

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currencyId: {
            userId,
            currencyId: payload.currencyId
          }
        }
      });
  
      if (!wallet) throw new AppError(404, "Wallet not found");

      const balance = toDecimal(wallet.balance);
  
      if (balance.lt(amount)) throw new AppError(400, "Insufficient balance");
  
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount.toString() }
        }
      });
  
      const transfer = await tx.externalTransfer.create({
        data: {
          userId,
          currencyId: payload.currencyId,
          toAddress: payload.toAddress,
          amount: amount.toString(),
          status: "PENDING"
        }
      });
  
      await tx.transaction.create({
        data: {
          userId,
          currencyId: payload.currencyId,
          type: "WITHDRAW",
          direction: 'OUT',
          amount: amount.toString(),
          referenceId: transfer.id
        }
      });
  
      return transfer;
    });
  }
}