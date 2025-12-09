-- Find and drop ANY index involving licenseNumber that isn't the new composite one
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'Prescriber'
          AND indexdef LIKE '%licenseNumber%'
          AND indexdef NOT LIKE '%storeId%' -- Don't drop our new composite index
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS "' || r.indexname || '" CASCADE';
        RAISE NOTICE 'Dropped index: %', r.indexname;
    END LOOP;
    
    -- Also try dropping unique constraints again just in case
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

-- Verify final indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Prescriber';
