-- Final attempt: Drop ALL unique constraints on licenseNumber and recreate only the composite one
-- Step 1: Drop any existing unique constraints on licenseNumber
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public."Prescriber"'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) LIKE '%licenseNumber%'
          AND pg_get_constraintdef(oid) NOT LIKE '%storeId%'
    ) LOOP
        EXECUTE 'ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "' || r.conname || '" CASCADE';
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Step 2: Ensure the composite constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Prescriber_storeId_licenseNumber_key'
          AND conrelid = 'public."Prescriber"'::regclass
    ) THEN
        ALTER TABLE "Prescriber" ADD CONSTRAINT "Prescriber_storeId_licenseNumber_key" 
            UNIQUE ("storeId", "licenseNumber");
        RAISE NOTICE 'Created composite constraint';
    ELSE
        RAISE NOTICE 'Composite constraint already exists';
    END IF;
END $$;

-- Step 3: Verify final state
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public."Prescriber"'::regclass
  AND contype = 'u'
ORDER BY conname;
