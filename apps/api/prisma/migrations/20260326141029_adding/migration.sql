/*
  Warnings:

  - The `days` column on the `BudgetLineItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BudgetLineItem" DROP COLUMN "days",
ADD COLUMN     "days" DOUBLE PRECISION;
