-- Migration: Add CHECK constraint to prevent negative inventory quantities
-- Purpose: Enforce non-negative stock quantities at the database level
-- Author: Antigravity
-- Date: 2025-12-11

-- Add CHECK constraint to InventoryBatch table
ALTER TABLE "InventoryBatch" 
ADD CONSTRAINT "InventoryBatch_quantityInStock_check" 
CHECK ("quantityInStock" >= 0);

-- Note: This constraint will prevent any UPDATE or INSERT operations
-- that would result in a negative quantityInStock value, even if
-- there are bugs in the application logic.
