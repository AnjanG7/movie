/*
  Warnings:

  - A unique constraint covering the columns `[sourceQuotationId]` on the table `FinancingSource` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FinancingSource" ADD COLUMN     "sourceQuotationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FinancingSource_sourceQuotationId_key" ON "FinancingSource"("sourceQuotationId");

-- AddForeignKey
ALTER TABLE "FinancingSource" ADD CONSTRAINT "FinancingSource_sourceQuotationId_fkey" FOREIGN KEY ("sourceQuotationId") REFERENCES "BudgetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
