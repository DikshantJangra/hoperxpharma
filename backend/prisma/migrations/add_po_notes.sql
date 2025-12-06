-- Add notes field to PurchaseOrder table
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "notes" TEXT;
