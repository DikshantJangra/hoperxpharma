-- Add POAttachment table for Purchase Order file attachments
CREATE TABLE IF NOT EXISTS "po_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalSize" BIGINT NOT NULL,
    "compressedSize" BIGINT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    CONSTRAINT "po_attachments_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on purchaseOrderId for faster queries
CREATE INDEX IF NOT EXISTS "po_attachments_purchaseOrderId_idx" ON "po_attachments"("purchaseOrderId");
