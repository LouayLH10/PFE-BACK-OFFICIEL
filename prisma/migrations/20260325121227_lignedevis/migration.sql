/*
  Warnings:

  - You are about to drop the column `validatedAt` on the `Quote` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ON_HOLD', 'IN_PROGRESS', 'READY');

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "validatedAt",
ADD COLUMN     "status" "QuoteStatus" NOT NULL DEFAULT 'ON_HOLD';

-- CreateTable
CREATE TABLE "Quoteligne" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "quoteId" INTEGER NOT NULL,

    CONSTRAINT "Quoteligne_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quoteligne" ADD CONSTRAINT "Quoteligne_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
