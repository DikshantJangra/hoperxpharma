-- Fix: Drop old unique constraint on licenseNumber
-- The migration didn't drop it properly, so we need to do it manually

-- Drop the old constraint
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key";

-- Verify the new composite constraint exists
-- If it doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Prescriber_storeId_licenseNumber_key'
    ) THEN
        ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_storeId_licenseNumber_key" 
            UNIQUE ("storeId", "licenseNumber");
    END IF;
END $$;
