-- Add analytics cache fields to Patient table for customer profile system upgrade
-- These fields enable fast list views without expensive joins

-- Create RiskLevel enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'ELEVATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add analytics cache fields to Patient table
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "visitCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "firstVisitAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "avgBillAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "onTimePaymentRate" DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS "systemTrustLevel" "TrustLevel",
  ADD COLUMN IF NOT EXISTS "riskLevel" "RiskLevel",
  ADD COLUMN IF NOT EXISTS "profileLastCalculatedAt" TIMESTAMP;

-- Add helpful comment
COMMENT ON COLUMN "Patient"."visitCount" IS 'Cached count of completed sales for fast queries';
COMMENT ON COLUMN "Patient"."onTimePaymentRate" IS 'Percentage of on-time credit payments (0.0000 = 0%, 1.0000 = 100%)';
COMMENT ON COLUMN "Patient"."systemTrustLevel" IS 'Auto-calculated trust level, separate from manual override';
COMMENT ON COLUMN "Patient"."riskLevel" IS 'Current risk assessment: LOW, MEDIUM, or ELEVATED';
COMMENT ON COLUMN "Patient"."profileLastCalculatedAt" IS 'Last time analytics were recalculated';
