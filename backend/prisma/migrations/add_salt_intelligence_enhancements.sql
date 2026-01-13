-- Salt Intelligence Production Enhancements Migration
-- This migration adds fields and indexes to support the production-grade salt intelligence system

-- Step 1: Add new fields to Drug table
ALTER TABLE "Drug" 
  ADD COLUMN IF NOT EXISTS "confirmedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

-- Step 2: Update default ingestionStatus from ACTIVE to SALT_PENDING for new drugs
-- Note: This doesn't affect existing drugs, only changes the default for new inserts
ALTER TABLE "Drug" 
  ALTER COLUMN "ingestionStatus" SET DEFAULT 'SALT_PENDING';

-- Step 3: Create SaltMappingAudit table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS "SaltMappingAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "drugId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "batchId" TEXT,
  "oldValue" JSONB,
  "newValue" JSONB NOT NULL,
  "ocrConfidence" DOUBLE PRECISION,
  "wasAutoMapped" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SaltMappingAudit_drugId_fkey" FOREIGN KEY ("drugId") 
    REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SaltMappingAudit_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 4: Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS "Drug_storeId_ingestionStatus_idx" 
  ON "Drug"("storeId", "ingestionStatus");

CREATE INDEX IF NOT EXISTS "Drug_confirmedBy_idx" 
  ON "Drug"("confirmedBy");

CREATE INDEX IF NOT EXISTS "SaltMappingAudit_drugId_createdAt_idx" 
  ON "SaltMappingAudit"("drugId", "createdAt");

CREATE INDEX IF NOT EXISTS "SaltMappingAudit_userId_createdAt_idx" 
  ON "SaltMappingAudit"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "SaltMappingAudit_batchId_idx" 
  ON "SaltMappingAudit"("batchId");

CREATE INDEX IF NOT EXISTS "SaltMappingAudit_action_idx" 
  ON "SaltMappingAudit"("action");

-- Step 5: Add comment for documentation
COMMENT ON TABLE "SaltMappingAudit" IS 'Audit log for all salt mapping changes including creation, updates, and bulk corrections';
COMMENT ON COLUMN "Drug"."confirmedBy" IS 'User ID of pharmacist who confirmed the salt mapping';
COMMENT ON COLUMN "Drug"."confirmedAt" IS 'Timestamp when salt mapping was confirmed and medicine activated';
COMMENT ON COLUMN "Drug"."ingestionStatus" IS 'Lifecycle state: DRAFT (incomplete), SALT_PENDING (needs confirmation), ACTIVE (confirmed and available)';
