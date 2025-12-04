/*
  Warnings:

  - Added the required column `storeId` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Drug_rxcui_key";

-- Step 1: Add storeId columns as nullable first
ALTER TABLE "Drug" ADD COLUMN "storeId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "storeId" TEXT;

-- Step 2: Update existing records with the first store ID
UPDATE "Drug" SET "storeId" = (SELECT id FROM "Store" LIMIT 1) WHERE "storeId" IS NULL;
UPDATE "Supplier" SET "storeId" = (SELECT id FROM "Store" LIMIT 1) WHERE "storeId" IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE "Drug" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "storeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Drug_storeId_idx" ON "Drug"("storeId");

-- CreateIndex
CREATE INDEX "Drug_storeId_name_idx" ON "Drug"("storeId", "name");

-- CreateIndex
CREATE INDEX "Drug_storeId_hsnCode_idx" ON "Drug"("storeId", "hsnCode");

-- CreateIndex
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");

-- CreateIndex
CREATE INDEX "Supplier_storeId_status_idx" ON "Supplier"("storeId", "status");

-- CreateIndex
CREATE INDEX "Supplier_storeId_deletedAt_idx" ON "Supplier"("storeId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
