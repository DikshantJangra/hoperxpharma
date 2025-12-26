-- Fix Prescription Status Values
-- Map old status values to new enum

-- Update old statuses to new ones
UPDATE "Prescription"
SET status = CASE 
    WHEN status = 'IN_PROGRESS' THEN 'ACTIVE'
    WHEN status = 'AWAITING_AUTH' THEN 'DRAFT'
    WHEN status = 'PARTIAL_FILLED' THEN 'ACTIVE'
    WHEN status = 'HOLD' THEN 'ON_HOLD'
    ELSE status -- Keep DRAFT, COMPLETED, CANCELLED as is
END
WHERE status IN ('IN_PROGRESS', 'AWAITING_AUTH', 'PARTIAL_FILLED', 'HOLD');

-- Report
DO $$
BEGIN
    RAISE NOTICE 'Fixed prescription statuses. Total prescriptions: %', (SELECT COUNT(*) FROM "Prescription");
END $$;
