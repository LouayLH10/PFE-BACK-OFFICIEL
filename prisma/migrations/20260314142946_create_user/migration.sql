/*
  Warnings:

  - You are about to drop the column `country` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Contact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "country",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "street",
DROP COLUMN "zipCode",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_key" ON "Contact"("userId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
