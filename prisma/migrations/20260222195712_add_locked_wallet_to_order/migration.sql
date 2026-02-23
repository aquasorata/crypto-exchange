/*
  Warnings:

  - Added the required column `lockedAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lockedWalletId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lockedAmount" DECIMAL(20,8) NOT NULL,
ADD COLUMN     "lockedWalletId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_lockedWalletId_fkey" FOREIGN KEY ("lockedWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
