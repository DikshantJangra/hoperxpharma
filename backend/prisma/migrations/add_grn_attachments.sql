-- Add GRNAttachment table for GRN invoice attachments
CREATE TABLE IF NOT EXISTS "grn_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grnId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalSize" BIGINT NOT NULL,
    "compressedSize" BIGINT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    CONSTRAINT "grn_attachments_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on grnId for faster queries
CREATE INDEX IF NOT EXISTS "grn_attachments_grnId_idx" ON "grn_attachments"("grnId");
