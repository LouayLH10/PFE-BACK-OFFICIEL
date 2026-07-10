/*
  Warnings:

  - Added the required column `contactId` to the `OcrDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OcrDocument" ADD COLUMN     "contactId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
