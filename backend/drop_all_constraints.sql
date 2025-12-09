-- Directly drop the constraint by name
-- Try all possible constraint names
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key" CASCADE;
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "prescriber_licensenumber_key" CASCADE;
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_unique" CASCADE;

-- Verify what constraints remain
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public."Prescriber"'::regclass AND contype = 'u';
