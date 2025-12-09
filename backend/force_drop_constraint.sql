-- Force drop the old unique constraint
-- First, find the exact constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Get the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public."Prescriber"'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%licenseNumber%'
      AND pg_get_constraintdef(oid) NOT LIKE '%storeId%';
    
    -- Drop it if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "Prescriber" DROP CONSTRAINT "' || constraint_name || '"';
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No old licenseNumber constraint found';
    END IF;
END $$;
