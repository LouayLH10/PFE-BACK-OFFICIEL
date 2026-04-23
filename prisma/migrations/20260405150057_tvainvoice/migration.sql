/*
  Warnings:

  - You are about to drop the column `tax` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "tax",
ADD COLUMN     "tva" DOUBLE PRECISION NOT NULL DEFAULT 0.19;
