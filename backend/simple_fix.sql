-- Drop the old constraint
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key" CASCADE;

-- Add composite constraint if it doesn't exist  
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
