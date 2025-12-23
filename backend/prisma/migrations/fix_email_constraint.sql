-- Fix unique constraint issue
-- Drop the old unique constraint on storeId to allow multiple email accounts per store

BEGIN;

-- Drop the old unique constraint on storeId if it exists
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the unique constraint on storeId column
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = '"EmailAccount"'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = '"EmailAccount"'::regclass AND attname = 'storeId');
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "EmailAccount" DROP CONSTRAINT "' || constraint_name || '"';
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No unique constraint on storeId found (already removed)';
    END IF;
END $$;

-- Verify the composite unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmailAccount_storeId_email_key'
    ) THEN
        -- Add it if it doesn't exist
        ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_storeId_email_key" UNIQUE ("storeId", "email");
        RAISE NOTICE 'Added composite unique constraint';
    ELSE
        RAISE NOTICE 'Composite unique constraint already exists';
    END IF;
END $$;

COMMIT;
