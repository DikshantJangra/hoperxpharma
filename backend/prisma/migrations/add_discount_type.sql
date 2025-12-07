-- Add discountType field to GRNItem table
ALTER TABLE "GRNItem" 
ADD COLUMN IF NOT EXISTS "discountType" TEXT DEFAULT 'BEFORE_GST';

-- Update existing records to have default discount type
UPDATE "GRNItem" 
SET "discountType" = 'BEFORE_GST' 
WHERE "discountType" IS NULL;
