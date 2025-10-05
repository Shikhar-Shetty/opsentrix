/*
  Warnings:

  - Added the required column `dailyinsights` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insightDate` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "dailyinsights" TEXT NOT NULL,
ADD COLUMN     "insightDate" TIMESTAMP(3) NOT NULL;
