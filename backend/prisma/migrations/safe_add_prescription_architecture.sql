-- SAFE MIGRATION: Add New Prescription Architecture
-- NO DATA LOSS: Preserves all existing data

-- Step 1: Create ENUM types
DO $$ BEGIN CREATE TYPE "PrescriptionType" AS ENUM ('REGULAR', 'ONE_TIME'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "RefillStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_USED', 'FULLY_USED', 'EXPIRED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DispenseStatus" AS ENUM ('QUEUED', 'VERIFYING', 'FILLING', 'CHECKING', 'READY', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 2: Add columns to Prescription
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='prescriptionNumber') THEN
        ALTER TABLE "Prescription" ADD COLUMN "prescriptionNumber" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='type') THEN
        ALTER TABLE "Prescription" ADD COLUMN "type" "PrescriptionType" DEFAULT 'REGULAR';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='issueDate') THEN
        ALTER TABLE "Prescription" ADD COLUMN "issueDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='expiryDate') THEN
        ALTER TABLE "Prescription" ADD COLUMN "expiryDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='totalRefills') THEN
        ALTER TABLE "Prescription" ADD COLUMN "totalRefills" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Generate prescription numbers using temp table
CREATE TEMP TABLE IF NOT EXISTS temp_rx_numbers AS
SELECT id, 'RX' || LPAD(ROW_NUMBER() OVER (PARTITION BY "storeId" ORDER BY "createdAt")::TEXT, 6, '0') as new_number
FROM "Prescription"
WHERE "prescriptionNumber" IS NULL;

UPDATE "Prescription" p
SET "prescriptionNumber" = t.new_number
FROM temp_rx_numbers t
WHERE p.id = t.id;

DROP TABLE IF EXISTS temp_rx_numbers;

-- Set expiry dates
UPDATE "Prescription" SET "expiryDate" = "createdAt" + INTERVAL '1 year' WHERE "expiryDate" IS NULL;

-- Make prescriptionNumber NOT NULL
DO $$ BEGIN ALTER TABLE "Prescription" ALTER COLUMN "prescriptionNumber" SET NOT NULL; EXCEPTION WHEN others THEN null; END $$;

-- Add constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Prescription_storeId_prescriptionNumber_key" ON "Prescription"("storeId", "prescriptionNumber");
CREATE INDEX IF NOT EXISTS "Prescription_type_idx" ON "Prescription"("type");

-- Step 3: Create tables
CREATE TABLE IF NOT EXISTS "PrescriptionVersion" (
    "id" TEXT PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "instructions" TEXT,
    "substitutionNotes" TEXT,
    "attachments" JSONB,
    "changedReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "PrescriptionVersion_prescriptionId_versionNumber_key" ON "PrescriptionVersion"("prescriptionId", "versionNumber");
CREATE INDEX IF NOT EXISTS "PrescriptionVersion_prescriptionId_idx" ON "PrescriptionVersion"("prescriptionId");
CREATE INDEX IF NOT EXISTS "PrescriptionVersion_createdAt_idx" ON "PrescriptionVersion"("createdAt");
DO $$ BEGIN ALTER TABLE "PrescriptionVersion" ADD CONSTRAINT "PrescriptionVersion_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "PrescriptionItemVersion" (
    "id" TEXT PRIMARY KEY,
    "prescriptionVersionId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantityPrescribed" INTEGER NOT NULL,
    "sig" TEXT,
    "daysSupply" INTEGER,
    "substitutionAllowed" BOOLEAN DEFAULT true,
    "isControlled" BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS "PrescriptionItemVersion_prescriptionVersionId_idx" ON "PrescriptionItemVersion"("prescriptionVersionId");
CREATE INDEX IF NOT EXISTS "PrescriptionItemVersion_drugId_idx" ON "PrescriptionItemVersion"("drugId");
DO $$ BEGIN
    ALTER TABLE "PrescriptionItemVersion" ADD CONSTRAINT "PrescriptionItemVersion_prescriptionVersionId_fkey" FOREIGN KEY ("prescriptionVersionId") REFERENCES "PrescriptionVersion"("id") ON DELETE CASCADE;
    ALTER TABLE "PrescriptionItemVersion" ADD CONSTRAINT "PrescriptionItemVersion_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id");
    ALTER TABLE "PrescriptionItemVersion" ADD CONSTRAINT "PrescriptionItemVersion_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Refill" (
    "id" TEXT PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "refillNumber" INTEGER NOT NULL,
    "authorizedQty" INTEGER NOT NULL,
    "dispensedQty" INTEGER DEFAULT 0,
    "remainingQty" INTEGER NOT NULL,
    "status" "RefillStatus" DEFAULT 'AVAILABLE',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Refill_prescriptionId_refillNumber_key" ON "Refill"("prescriptionId", "refillNumber");
CREATE INDEX IF NOT EXISTS "Refill_prescriptionId_idx" ON "Refill"("prescriptionId");
CREATE INDEX IF NOT EXISTS "Refill_status_idx" ON "Refill"("status");
DO $$ BEGIN ALTER TABLE "Refill" ADD CONSTRAINT "Refill_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Dispense" (
    "id" TEXT PRIMARY KEY,
    "refillId" TEXT NOT NULL,
    "prescriptionVersionId" TEXT NOT NULL,
    "status" "DispenseStatus" DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verifyingAt" TIMESTAMP(3),
    "fillingAt" TIMESTAMP(3),
    "checkingAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "queuedBy" TEXT,
    "verifiedBy" TEXT,
    "filledBy" TEXT,
    "checkedBy" TEXT,
    "dispensedBy" TEXT,
    "quantityDispensed" INTEGER,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Dispense_refillId_idx" ON "Dispense"("refillId");
CREATE INDEX IF NOT EXISTS "Dispense_prescriptionVersionId_idx" ON "Dispense"("prescriptionVersionId");
CREATE INDEX IF NOT EXISTS "Dispense_status_idx" ON "Dispense"("status");
DO $$ BEGIN
    ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_refillId_fkey" FOREIGN KEY ("refillId") REFERENCES "Refill"("id") ON DELETE CASCADE;
    ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_prescriptionVersionId_fkey" FOREIGN KEY ("prescriptionVersionId") REFERENCES "PrescriptionVersion"("id");
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add dispenseId to Sale
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sale' AND column_name='dispenseId') THEN ALTER TABLE "Sale" ADD COLUMN "dispenseId" TEXT; END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_dispenseId_key" ON "Sale"("dispenseId");
DO $$ BEGIN ALTER TABLE "Sale" ADD CONSTRAINT "Sale_dispenseId_fkey" FOREIGN KEY ("dispenseId") REFERENCES "Dispense"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Migrate data
DO $$
DECLARE default_user TEXT;
BEGIN
    SELECT id INTO default_user FROM "User" LIMIT 1;
    INSERT INTO "PrescriptionVersion" ("id", "prescriptionId", "versionNumber", "instructions", "createdBy", "createdAt")
    SELECT gen_random_uuid()::text, p.id, 1, p.notes, COALESCE(p."assignedTo", default_user), p."createdAt"
    FROM "Prescription" p WHERE NOT EXISTS (SELECT 1 FROM "PrescriptionVersion" pv WHERE pv."prescriptionId" = p.id);
    
    INSERT INTO "PrescriptionItemVersion" ("id", "prescriptionVersionId", "drugId", "batchId", "quantityPrescribed", "sig", "daysSupply", "isControlled")
    SELECT gen_random_uuid()::text, pv.id, pi."drugId", pi."batchId", pi."quantityPrescribed", pi.sig, pi."daysSupply", pi."isControlled"
    FROM "PrescriptionItem" pi
    JOIN "PrescriptionVersion" pv ON pv."prescriptionId" = pi."prescriptionId" AND pv."versionNumber" = 1
    WHERE NOT EXISTS (SELECT 1 FROM "PrescriptionItemVersion" piv WHERE piv."prescriptionVersionId" = pv.id);
    
    INSERT INTO "Refill" ("id", "prescriptionId", "refillNumber", "authorizedQty", "dispensedQty", "remainingQty", "status", "expiresAt", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text, p.id, 0,
        GREATEST(COALESCE((SELECT SUM(pi."quantityPrescribed") FROM "PrescriptionItem" pi WHERE pi."prescriptionId" = p.id), 30), 1),
        CASE WHEN p.status IN ('COMPLETED', 'CANCELLED') THEN GREATEST(COALESCE((SELECT SUM(pi."quantityPrescribed") FROM "PrescriptionItem" pi WHERE pi."prescriptionId" = p.id), 30), 1) ELSE 0 END,
        CASE WHEN p.status IN ('COMPLETED', 'CANCELLED') THEN 0 ELSE GREATEST(COALESCE((SELECT SUM(pi."quantityPrescribed") FROM "PrescriptionItem" pi WHERE pi."prescriptionId" = p.id), 30), 1) END,
        CASE WHEN p.status = 'COMPLETED' THEN 'FULLY_USED'::"RefillStatus" WHEN p.status = 'CANCELLED' THEN 'CANCELLED'::"RefillStatus" ELSE 'AVAILABLE'::"RefillStatus" END,
        p."expiryDate", p."createdAt", p."updatedAt"
    FROM "Prescription" p
    WHERE NOT EXISTS (SELECT 1 FROM "Refill" r WHERE r."prescriptionId" = p.id);
    
    RAISE NOTICE 'Migration complete! % prescriptions migrated', (SELECT COUNT(*) FROM "Prescription");
END $$;
