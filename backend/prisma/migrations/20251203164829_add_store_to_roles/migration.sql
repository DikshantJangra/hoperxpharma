-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "storeId" TEXT;

-- CreateIndex
CREATE INDEX "Role_storeId_idx" ON "Role"("storeId");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
