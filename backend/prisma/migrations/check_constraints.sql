-- Check current constraints on EmailAccount table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = '"EmailAccount"'::regclass
AND c.contype IN ('u', 'p')
ORDER BY conname;
