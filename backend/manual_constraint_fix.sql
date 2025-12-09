-- Simple script to list and drop ALL unique constraints on Prescriber
-- Then recreate only the one we want

-- Step 1: List current constraints
\echo 'Current constraints:'
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public."Prescriber"'::regclass AND contype = 'u';

-- Step 2: Drop the problematic constraint by exact name
-- We know from the error it's called "licenseNumber" in the constraint
ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key";

-- Step 3: Verify it's gone
\echo 'After drop:'
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public."Prescriber"'::regclass AND contype = 'u';

-- Step 4: Add the composite constraint if missing
ALTER TABLE "Prescriber" ADD CONSTRAINT IF NOT EXISTS "Prescriber_storeId_licenseNumber_key" 
    UNIQUE ("storeId", "licenseNumber");

-- Step 5: Final verification
\echo 'Final state:'
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public."Prescriber"'::regclass AND contype = 'u';
