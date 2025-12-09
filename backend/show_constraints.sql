-- Get the EXACT constraint name and drop it
SELECT 
    'ALTER TABLE "Prescriber" DROP CONSTRAINT "' || conname || '" CASCADE;' as drop_command,
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public."Prescriber"'::regclass
  AND contype = 'u';
