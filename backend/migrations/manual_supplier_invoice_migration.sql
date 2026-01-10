-- Supplier Invoice Schema Enhancements
-- Safe migration - preserves all existing data
-- Run when database is accessible

-- Step 1: Add new columns to ConsolidatedInvoice
ALTER TABLE "consolidated_invoices" 
  ADD COLUMN IF NOT EXISTS "adjustments" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID' NOT NULL,
  ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "supplierInvoiceNo" TEXT,
  ADD COLUMN IF NOT EXISTS "supplierInvoiceDate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "supplierInvoiceFile" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "confirmedBy" TEXT;

-- Step 2: Add new enum values (safe - doesn't break existing)
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'SENT_TO_SUPPLIER';
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "ConsolidatedInvoiceStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Step 3: Enhance ConsolidatedInvoiceItem
ALTER TABLE "consolidated_invoice_items"
  ADD COLUMN IF NOT EXISTS "grnItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "receivedQty" INTEGER,
  ADD COLUMN IF NOT EXISTS "freeQty" INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "billedQty" INTEGER,
  ADD COLUMN IF NOT EXISTS "poNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "grnNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "receivedDate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "isExcluded" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "isDisputed" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "disputeNotes" TEXT;

-- Migrate existing totalQuantity to receivedQty and billedQty
UPDATE "consolidated_invoice_items" 
SET 
  "receivedQty" = COALESCE("totalQuantity", 0),
  "billedQty" = COALESCE("totalQuantity", 0)
WHERE "receivedQty" IS NULL;

-- Step 4: Create SupplierInvoicePayment table
CREATE TABLE IF NOT EXISTS "supplier_invoice_payments" (
  "id" TEXT PRIMARY KEY,
  "consolidatedInvoiceId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentDate" TIMESTAMP NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdBy" TEXT NOT NULL,
  FOREIGN KEY ("consolidatedInvoiceId") REFERENCES "consolidated_invoices"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id")
);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS "supplier_invoice_payments_consolidatedInvoiceId_idx" ON "supplier_invoice_payments"("consolidatedInvoiceId");
CREATE INDEX IF NOT EXISTS "supplier_invoice_payments_paymentDate_idx" ON "supplier_invoice_payments"("paymentDate");

-- Verification queries (run after migration)
-- SELECT COUNT(*) FROM consolidated_invoices;
-- SELECT COUNT(*) FROM supplier_invoice_payments;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consolidated_invoices';
