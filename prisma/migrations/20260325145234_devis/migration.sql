/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unity` to the `Quoteligne` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Quoteligne" ADD COLUMN     "unity" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");
