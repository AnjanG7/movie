/*
  Warnings:

  - A unique constraint covering the columns `[projectId,version]` on the table `BudgetVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BudgetVersion" ADD COLUMN     "assumptions" JSONB,
ADD COLUMN     "financingPlan" JSONB,
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "revenueModel" JSONB,
ADD COLUMN     "template" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BudgetVersion_projectId_version_key" ON "BudgetVersion"("projectId", "version");
