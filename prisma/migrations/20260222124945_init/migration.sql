/*
  Warnings:

  - You are about to drop the column `fee` on the `Trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[buyOrderId,sellOrderId,createdAt]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientOrderId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `remainingAmount` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `currencyId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerOrderId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerOrderId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'FEE';

-- AlterTable
ALTER TABLE "InternalTransfer" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(28,8);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientOrderId" TEXT NOT NULL,
ALTER COLUMN "remainingAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "fee",
ADD COLUMN     "buyerFee" DECIMAL(28,8) NOT NULL DEFAULT 0.00000000,
ADD COLUMN     "buyerFeeRate" DECIMAL(10,8) NOT NULL DEFAULT 0.00000000,
ADD COLUMN     "currencyId" BIGINT NOT NULL,
ADD COLUMN     "makerOrderId" BIGINT NOT NULL,
ADD COLUMN     "sellerFee" DECIMAL(28,8) NOT NULL DEFAULT 0.00000000,
ADD COLUMN     "sellerFeeRate" DECIMAL(10,8) NOT NULL DEFAULT 0.00000000,
ADD COLUMN     "takerOrderId" BIGINT NOT NULL,
ADD COLUMN     "value" DECIMAL(28,8) NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(28,8),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(28,8);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(28,8);

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "lockedBalance" DECIMAL(20,8) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Order_clientOrderId_key" ON "Order"("clientOrderId");

-- CreateIndex
CREATE INDEX "Trade_currencyId_idx" ON "Trade"("currencyId");

-- CreateIndex
CREATE INDEX "Trade_buyOrderId_idx" ON "Trade"("buyOrderId");

-- CreateIndex
CREATE INDEX "Trade_sellOrderId_idx" ON "Trade"("sellOrderId");

-- CreateIndex
CREATE INDEX "Trade_takerOrderId_idx" ON "Trade"("takerOrderId");

-- CreateIndex
CREATE INDEX "Trade_makerOrderId_idx" ON "Trade"("makerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_buyOrderId_sellOrderId_createdAt_key" ON "Trade"("buyOrderId", "sellOrderId", "createdAt");
