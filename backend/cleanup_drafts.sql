-- Quick cleanup script to delete test draft invoices
-- Run this in Prisma Studio or via psql

-- Delete all DRAFT supplier invoices and their items
DELETE FROM "consolidated_invoice_items" 
WHERE "consolidatedInvoiceId" IN (
  SELECT id FROM "consolidated_invoices" 
  WHERE status = 'DRAFT'
);

DELETE FROM "consolidated_invoices" 
WHERE status = 'DRAFT';

-- This will make all GRN items available for invoicing again
