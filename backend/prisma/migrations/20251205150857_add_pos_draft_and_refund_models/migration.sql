-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE "SaleDraft" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "draftNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerId" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleRefund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "originalSaleId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "refundReason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleRefundItem" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleRefundItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleDraft_draftNumber_key" ON "SaleDraft"("draftNumber");

-- CreateIndex
CREATE INDEX "SaleDraft_storeId_createdAt_idx" ON "SaleDraft"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleDraft_expiresAt_idx" ON "SaleDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "SaleDraft_storeId_expiresAt_idx" ON "SaleDraft"("storeId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SaleRefund_refundNumber_key" ON "SaleRefund"("refundNumber");

-- CreateIndex
CREATE INDEX "SaleRefund_storeId_status_idx" ON "SaleRefund"("storeId", "status");

-- CreateIndex
CREATE INDEX "SaleRefund_originalSaleId_idx" ON "SaleRefund"("originalSaleId");

-- CreateIndex
CREATE INDEX "SaleRefund_storeId_createdAt_idx" ON "SaleRefund"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleRefundItem_refundId_idx" ON "SaleRefundItem"("refundId");

-- CreateIndex
CREATE INDEX "SaleRefundItem_saleItemId_idx" ON "SaleRefundItem"("saleItemId");

-- CreateIndex
CREATE INDEX "Sale_storeId_status_idx" ON "Sale"("storeId", "status");

-- AddForeignKey
ALTER TABLE "SaleDraft" ADD CONSTRAINT "SaleDraft_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRefund" ADD CONSTRAINT "SaleRefund_originalSaleId_fkey" FOREIGN KEY ("originalSaleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRefund" ADD CONSTRAINT "SaleRefund_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRefundItem" ADD CONSTRAINT "SaleRefundItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "SaleRefund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
