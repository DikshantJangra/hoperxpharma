-- Custom migration to add storeId to Prescriber table only
-- This is safe to run on the restored database

-- Step 1: Add storeId column (nullable first to allow existing data)
ALTER TABLE "Prescriber" ADD COLUMN IF NOT EXISTS "storeId" TEXT;

-- Step 2: Update existing prescribers with storeId from their prescriptions
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

-- Step 3: For any remaining prescribers without storeId, get the first available store
-- (This handles orphaned prescribers)
UPDATE "Prescriber" p
SET "storeId" = (SELECT id FROM "Store" LIMIT 1)
WHERE p."storeId" IS NULL;

-- Step 4: Now make storeId NOT NULL since all prescribers have a value
ALTER TABLE "Prescriber" ALTER COLUMN "storeId" SET NOT NULL;

-- Step 5: Drop the old unique constraint on licenseNumber
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key";

-- Step 6: Add new unique constraint on (storeId, licenseNumber)
ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_storeId_licenseNumber_key" 
    UNIQUE ("storeId", "licenseNumber");

-- Step 7: Add index on storeId
CREATE INDEX IF NOT EXISTS "Prescriber_storeId_idx" ON "Prescriber"("storeId");

-- Step 8: Add foreign key constraint
ALTER TABLE "Prescriber" ADD CONSTRAINT IF NOT EXISTS "Prescriber_storeId_fkey" 
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
