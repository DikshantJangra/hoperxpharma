-- Force drop ALL unique constraints on storeId and recreate only the composite one

BEGIN;

-- Drop ANY constraint that involves only storeId
ALTER TABLE "EmailAccount" DROP CONSTRAINT IF EXISTS "EmailAccount_storeId_key";
ALTER TABLE "EmailAccount" DROP CONSTRAINT IF EXISTS "EmailAccount_storeId_fkey";

-- Ensure the composite unique constraint exists
ALTER TABLE "EmailAccount" DROP CONSTRAINT IF EXISTS "EmailAccount_storeId_email_key";
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_storeId_email_key" UNIQUE ("storeId", "email");

COMMIT;

-- Verify
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = '"EmailAccount"'::regclass 
AND contype = 'u';
