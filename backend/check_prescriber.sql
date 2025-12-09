-- Check if prescriber with this license already exists
SELECT id, "storeId", name, "licenseNumber" 
FROM "Prescriber" 
WHERE "licenseNumber" = 'DMC/69444';

-- Also list all unique constraints on Prescriber table
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public."Prescriber"'::regclass
  AND contype = 'u';
