-- Step 1: Check existing prescribers and their storeId status
SELECT 
    p.id,
    p.name,
    p."licenseNumber",
    p."storeId",
    COUNT(pr.id) as prescription_count,
    STRING_AGG(DISTINCT pr."storeId", ', ') as used_in_stores
FROM "Prescriber" p
LEFT JOIN "Prescription" pr ON pr."prescriberId" = p.id
GROUP BY p.id, p.name, p."licenseNumber", p."storeId";

-- Step 2: For prescribers without storeId, assign them to the store of their first prescription
-- If they have no prescriptions, we'll need to handle them separately
UPDATE "Prescriber" p
SET "storeId" = (
    SELECT pr."storeId"
    FROM "Prescription" pr
    WHERE pr."prescriberId" = p.id
    LIMIT 1
)
WHERE p."storeId" IS NULL
AND EXISTS (
    SELECT 1 FROM "Prescription" pr WHERE pr."prescriberId" = p.id
);

-- Step 3: Check if there are any prescribers still without storeId (orphaned ones)
SELECT id, name, "licenseNumber"
FROM "Prescriber"
WHERE "storeId" IS NULL;
