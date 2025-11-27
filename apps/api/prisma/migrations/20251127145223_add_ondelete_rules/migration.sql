-- DropForeignKey
ALTER TABLE "public"."Allocation" DROP CONSTRAINT "Allocation_scheduledPaymentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BudgetLineItem" DROP CONSTRAINT "BudgetLineItem_budgetVersionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BudgetVersion" DROP CONSTRAINT "BudgetVersion_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CashflowForecast" DROP CONSTRAINT "CashflowForecast_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChangeOrder" DROP CONSTRAINT "ChangeOrder_versionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DistributionDeal" DROP CONSTRAINT "DistributionDeal_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DistributionDeal" DROP CONSTRAINT "DistributionDeal_waterfallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Drawdown" DROP CONSTRAINT "Drawdown_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FinancingSource" DROP CONSTRAINT "FinancingSource_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Installment" DROP CONSTRAINT "Installment_scheduledPaymentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_poId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PAndATask" DROP CONSTRAINT "PAndATask_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Participant" DROP CONSTRAINT "Participant_financingSourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Participant" DROP CONSTRAINT "Participant_waterfallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PhaseEntity" DROP CONSTRAINT "PhaseEntity_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PostTask" DROP CONSTRAINT "PostTask_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_budgetLineId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RevenueStatement" DROP CONSTRAINT "RevenueStatement_dealId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WaterfallDefinition" DROP CONSTRAINT "WaterfallDefinition_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WaterfallPayout" DROP CONSTRAINT "WaterfallPayout_participantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WaterfallPeriod" DROP CONSTRAINT "WaterfallPeriod_waterfallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WaterfallTier" DROP CONSTRAINT "WaterfallTier_waterfallId_fkey";

-- AddForeignKey
ALTER TABLE "PhaseEntity" ADD CONSTRAINT "PhaseEntity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetVersion" ADD CONSTRAINT "BudgetVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "BudgetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BudgetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_scheduledPaymentId_fkey" FOREIGN KEY ("scheduledPaymentId") REFERENCES "ScheduledPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_scheduledPaymentId_fkey" FOREIGN KEY ("scheduledPaymentId") REFERENCES "ScheduledPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingSource" ADD CONSTRAINT "FinancingSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawdown" ADD CONSTRAINT "Drawdown_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "FinancingSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowForecast" ADD CONSTRAINT "CashflowForecast_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTask" ADD CONSTRAINT "PostTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PAndATask" ADD CONSTRAINT "PAndATask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionDeal" ADD CONSTRAINT "DistributionDeal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionDeal" ADD CONSTRAINT "DistributionDeal_waterfallId_fkey" FOREIGN KEY ("waterfallId") REFERENCES "WaterfallDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueStatement" ADD CONSTRAINT "RevenueStatement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DistributionDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterfallDefinition" ADD CONSTRAINT "WaterfallDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterfallTier" ADD CONSTRAINT "WaterfallTier_waterfallId_fkey" FOREIGN KEY ("waterfallId") REFERENCES "WaterfallDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_waterfallId_fkey" FOREIGN KEY ("waterfallId") REFERENCES "WaterfallDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_financingSourceId_fkey" FOREIGN KEY ("financingSourceId") REFERENCES "FinancingSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterfallPayout" ADD CONSTRAINT "WaterfallPayout_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterfallPeriod" ADD CONSTRAINT "WaterfallPeriod_waterfallId_fkey" FOREIGN KEY ("waterfallId") REFERENCES "WaterfallDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
