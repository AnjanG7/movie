-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
