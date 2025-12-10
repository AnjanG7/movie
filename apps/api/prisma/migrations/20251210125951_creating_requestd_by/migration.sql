/*
  Warnings:

  - Made the column `updatedAt` on table `FinancingSource` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "FinancingSource_sourceQuotationId_key";

-- AlterTable
ALTER TABLE "FinancingSource" ALTER COLUMN "fees" SET DEFAULT 0,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "requestedBy" TEXT;
