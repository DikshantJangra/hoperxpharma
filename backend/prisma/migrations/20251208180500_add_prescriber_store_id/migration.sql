-- Migration: Add storeId to Prescriber table
-- This migration safely adds storeId to existing prescribers

-- Step 1: Add storeId column as nullable
ALTER TABLE "Prescriber" ADD COLUMN "storeId" TEXT;

-- Step 2: Update existing prescribers with storeId from their first prescription
UPDATE "Prescriber" p
SET "storeId" = (
    SELECT pr."storeId"
    FROM "Prescription" pr
    WHERE pr."prescriberId" = p.id
    LIMIT 1
)
WHERE p."storeId" IS NULL
AND EXISTS (
    SELECT 1 FROM "Prescription" pr WHERE pr."prescriberId" = p.id
);

-- Step 3: For orphaned prescribers (no prescriptions), assign to first available store
UPDATE "Prescriber" p
SET "storeId" = (SELECT id FROM "Store" ORDER BY "createdAt" ASC LIMIT 1)
WHERE p."storeId" IS NULL;

-- Step 4: Make storeId NOT NULL now that all rows have values
ALTER TABLE "Prescriber" ALTER COLUMN "storeId" SET NOT NULL;

-- Step 5: Drop old unique constraint on licenseNumber
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key";

-- Step 6: Add new unique constraint on (storeId, licenseNumber)
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_storeId_licenseNumber_key" 
    UNIQUE ("storeId", "licenseNumber");

-- Step 7: Add index on storeId for performance
CREATE INDEX "Prescriber_storeId_idx" ON "Prescriber"("storeId");

-- Step 8: Add foreign key constraint
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_storeId_fkey" 
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
