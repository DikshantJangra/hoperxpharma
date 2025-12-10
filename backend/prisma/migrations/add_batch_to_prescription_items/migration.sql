-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN "batchId" TEXT;

-- CreateIndex
CREATE INDEX "PrescriptionItem_batchId_idx" ON "PrescriptionItem"("batchId");

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
