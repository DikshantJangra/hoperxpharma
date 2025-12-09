-- Check all prescribers and their stores
SELECT id, "storeId", name, "licenseNumber" 
FROM "Prescriber" 
ORDER BY "createdAt" DESC;
