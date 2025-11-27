-- CreateEnum
CREATE TYPE "PublicityCategory" AS ENUM ('TRAILER', 'KEY_ART', 'POSTER', 'DIGITAL_MARKETING', 'SOCIAL_MEDIA', 'PR', 'FESTIVALS', 'SCREENINGS', 'PRINT_ADS', 'OOH', 'TV_SPOTS', 'RADIO', 'PRESS_KIT', 'PREMIERE', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignEventType" AS ENUM ('TEASER_RELEASE', 'TRAILER_RELEASE', 'POSTER_REVEAL', 'FESTIVAL_SUBMISSION', 'FESTIVAL_SCREENING', 'PREMIERE', 'THEATRICAL_RELEASE', 'STREAMING_RELEASE', 'PRESS_CONFERENCE', 'SOCIAL_MEDIA_CAMPAIGN', 'TV_APPEARANCE', 'PRESS_JUNKET', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PublicityBudget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PublicityCategory" NOT NULL,
    "description" TEXT,
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendor" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "PublicityStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PublicityBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicityExpense" (
    "id" TEXT NOT NULL,
    "publicityBudgetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "invoiceNumber" TEXT,
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicityExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicityBudgetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CampaignEventType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "deliverable" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "CampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicityBudget_projectId_idx" ON "PublicityBudget"("projectId");

-- CreateIndex
CREATE INDEX "PublicityBudget_category_idx" ON "PublicityBudget"("category");

-- CreateIndex
CREATE INDEX "PublicityBudget_status_idx" ON "PublicityBudget"("status");

-- CreateIndex
CREATE INDEX "PublicityExpense_publicityBudgetId_idx" ON "PublicityExpense"("publicityBudgetId");

-- CreateIndex
CREATE INDEX "PublicityExpense_expenseDate_idx" ON "PublicityExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "CampaignEvent_projectId_idx" ON "CampaignEvent"("projectId");

-- CreateIndex
CREATE INDEX "CampaignEvent_startDate_idx" ON "CampaignEvent"("startDate");

-- CreateIndex
CREATE INDEX "CampaignEvent_status_idx" ON "CampaignEvent"("status");

-- AddForeignKey
ALTER TABLE "PublicityBudget" ADD CONSTRAINT "PublicityBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicityExpense" ADD CONSTRAINT "PublicityExpense_publicityBudgetId_fkey" FOREIGN KEY ("publicityBudgetId") REFERENCES "PublicityBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvent" ADD CONSTRAINT "CampaignEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvent" ADD CONSTRAINT "CampaignEvent_publicityBudgetId_fkey" FOREIGN KEY ("publicityBudgetId") REFERENCES "PublicityBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
