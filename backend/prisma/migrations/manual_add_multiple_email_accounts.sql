-- Migration: Add Multiple Email Accounts Support
-- This migration safely updates the EmailAccount model to support multiple accounts per store
-- IMPORTANT: Run this in a transaction and test on staging first!

BEGIN;

-- Step 1: Add isPrimary column with default false
ALTER TABLE "EmailAccount" 
ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Set all existing accounts as primary (since they're currently the only ones)
UPDATE "EmailAccount" 
SET "isPrimary" = true 
WHERE TRUE;

-- Step 3: Drop the unique constraint  on storeId to allow multiple accounts
-- First, find the constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = '"EmailAccount"'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = '"EmailAccount"'::regclass AND attname = 'storeId');
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "EmailAccount" DROP CONSTRAINT "' || constraint_name || '"';
    END IF;
END $$;

-- Step 4: Add composite unique constraint to prevent duplicate emails per store
ALTER TABLE "EmailAccount" 
ADD CONSTRAINT "EmailAccount_storeId_email_key" UNIQUE ("storeId", "email");

-- Step 5: Add index for optimizing primary account queries
CREATE INDEX IF NOT EXISTS "EmailAccount_storeId_isPrimary_idx" 
ON "EmailAccount"("storeId", "isPrimary");

-- Step 6: Verify the migration
DO $$
BEGIN
    -- Check that isPrimary column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EmailAccount' AND column_name = 'isPrimary'
    ) THEN
        RAISE EXCEPTION 'isPrimary column was not created';
    END IF;
    
    -- Check that unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmailAccount_storeId_email_key'
    ) THEN
        RAISE EXCEPTION 'Unique constraint was not created';
    END IF;
    
    -- Check that index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'EmailAccount_storeId_isPrimary_idx'
    ) THEN
        RAISE EXCEPTION 'Index was not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

COMMIT;

-- Rollback script (in case you need to revert)
-- BEGIN;
-- ALTER TABLE "EmailAccount" DROP COLUMN IF EXISTS "isPrimary";
-- ALTER TABLE "EmailAccount" DROP CONSTRAINT IF EXISTS "EmailAccount_storeId_email_key";
-- DROP INDEX IF EXISTS "EmailAccount_storeId_isPrimary_idx";
-- ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_storeId_key" UNIQUE ("storeId");
-- COMMIT;
