-- AlterTable
ALTER TABLE "PhaseEntity" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "currentPhase" "Phase" NOT NULL DEFAULT 'DEVELOPMENT';
