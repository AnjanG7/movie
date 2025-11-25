-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "budgetLineId" TEXT;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
