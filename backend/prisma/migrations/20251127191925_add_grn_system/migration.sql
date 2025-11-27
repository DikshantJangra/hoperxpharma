/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscrepancyReason" AS ENUM ('SHORTAGE', 'OVERAGE', 'DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'MISSING');

-- CreateEnum
CREATE TYPE "DiscrepancyResolution" AS ENUM ('BACKORDER', 'CANCELLED', 'DEBIT_NOTE', 'ACCEPTED');

-- DropIndex
DROP INDEX "public"."Permission_name_key";

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "packSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "packUnit" TEXT NOT NULL DEFAULT 'Strip',
ADD COLUMN     "receivedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "builtIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "storeId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AdminPin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POTemplate" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "supplierId" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "POTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2),
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "POTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceivedNote" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "GRNStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierInvoiceNo" TEXT,
    "supplierInvoiceDate" TIMESTAMP(3),
    "receivedBy" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceivedNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GRNItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "poItemId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL,
    "freeQty" INTEGER NOT NULL DEFAULT 0,
    "rejectedQty" INTEGER NOT NULL DEFAULT 0,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "GRNItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GRNDiscrepancy" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "grnItemId" TEXT,
    "reason" "DiscrepancyReason" NOT NULL,
    "resolution" "DiscrepancyResolution",
    "expectedQty" INTEGER,
    "actualQty" INTEGER,
    "discrepancyQty" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "debitNoteValue" DECIMAL(10,2),
    "debitNoteGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "GRNDiscrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_roleId_idx" ON "UserRoleAssignment"("roleId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_storeId_idx" ON "UserRoleAssignment"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_roleId_storeId_key" ON "UserRoleAssignment"("userId", "roleId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPin_userId_key" ON "AdminPin"("userId");

-- CreateIndex
CREATE INDEX "AdminPin_userId_idx" ON "AdminPin"("userId");

-- CreateIndex
CREATE INDEX "POTemplate_storeId_isActive_idx" ON "POTemplate"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "POTemplate_storeId_deletedAt_idx" ON "POTemplate"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "POTemplateItem_templateId_idx" ON "POTemplateItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceivedNote_grnNumber_key" ON "GoodsReceivedNote"("grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceivedNote_poId_idx" ON "GoodsReceivedNote"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceivedNote_storeId_idx" ON "GoodsReceivedNote"("storeId");

-- CreateIndex
CREATE INDEX "GoodsReceivedNote_status_idx" ON "GoodsReceivedNote"("status");

-- CreateIndex
CREATE INDEX "GRNItem_grnId_idx" ON "GRNItem"("grnId");

-- CreateIndex
CREATE INDEX "GRNItem_poItemId_idx" ON "GRNItem"("poItemId");

-- CreateIndex
CREATE INDEX "GRNDiscrepancy_grnId_idx" ON "GRNDiscrepancy"("grnId");

-- CreateIndex
CREATE INDEX "GRNDiscrepancy_reason_idx" ON "GRNDiscrepancy"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "Role_builtIn_idx" ON "Role"("builtIn");

-- CreateIndex
CREATE INDEX "Role_category_idx" ON "Role"("category");

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPin" ADD CONSTRAINT "AdminPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POTemplateItem" ADD CONSTRAINT "POTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "POTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNote" ADD CONSTRAINT "GoodsReceivedNote_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GRNItem" ADD CONSTRAINT "GRNItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GRNDiscrepancy" ADD CONSTRAINT "GRNDiscrepancy_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
