-- Add customer profile lifecycle + credit policy support
CREATE TYPE "PatientLifecycleStage" AS ENUM ('IDENTIFIED', 'ESTABLISHED', 'TRUSTED', 'CREDIT_ELIGIBLE');
CREATE TYPE "TrustLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "RiskTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "lifecycleStage" "PatientLifecycleStage" NOT NULL DEFAULT 'IDENTIFIED',
  ADD COLUMN IF NOT EXISTS "manualTrustLevel" "TrustLevel",
  ADD COLUMN IF NOT EXISTS "creditEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "creditSuspendedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "profileStrength" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastVisitAt" TIMESTAMP;

CREATE TABLE IF NOT EXISTS "StoreCreditPolicy" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL UNIQUE,
  "maxCreditIdentified" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "maxCreditEstablished" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  "maxCreditTrusted" DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
  "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
  "lateAfterDays" INTEGER NOT NULL DEFAULT 7,
  "autoSuspendAfterLates" INTEGER NOT NULL DEFAULT 3,
  "minOnTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "minVisitsEstablished" INTEGER NOT NULL DEFAULT 2,
  "minVisitsTrusted" INTEGER NOT NULL DEFAULT 6,
  "minDaysSinceFirstVisit" INTEGER NOT NULL DEFAULT 30,
  "riskTolerance" "RiskTolerance" NOT NULL DEFAULT 'MEDIUM',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "StoreCreditPolicy_storeId_idx" ON "StoreCreditPolicy"("storeId");

ALTER TABLE "StoreCreditPolicy"
  ADD CONSTRAINT "StoreCreditPolicy_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
