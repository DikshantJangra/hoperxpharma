-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'ON_HOLD', 'AWAITING_AUTH', 'PARTIAL_FILLED', 'COMPLETED', 'CANCELLED', 'VERIFIED', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('REGULAR', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "RefillStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_USED', 'FULLY_USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispenseStatus" AS ENUM ('QUEUED', 'VERIFYING', 'FILLING', 'CHECKING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispenseWorkflowStatus" AS ENUM ('INTAKE', 'VERIFY', 'FILL', 'CHECK', 'RELEASE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'OVERSTOCKED', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'WALLET', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RECEIPT', 'GST_INVOICE', 'CREDIT_NOTE', 'ESTIMATE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED', 'QUOTATION');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'PARTIAL', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('NEW', 'SNOOZED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertCategory" AS ENUM ('INVENTORY', 'SECURITY', 'PATIENT', 'BILLING', 'SYSTEM', 'CLINICAL');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('IN_APP', 'WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscrepancyReason" AS ENUM ('SHORTAGE', 'OVERAGE', 'DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'MISSING');

-- CreateEnum
CREATE TYPE "DiscrepancyResolution" AS ENUM ('BACKORDER', 'CANCELLED', 'DEBIT_NOTE', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "LoyaltyStatus" AS ENUM ('NEW', 'REGULAR', 'TRUSTED', 'INSIDER', 'ADVOCATE');

-- CreateEnum
CREATE TYPE "LoyaltyEventType" AS ENUM ('PURCHASE_COMPLETED', 'FEEDBACK_SUBMITTED', 'PRESCRIPTION_FILLED', 'MILESTONE_REACHED', 'REWARD_EARNED', 'REWARD_REDEEMED', 'COMEBACK');

-- CreateEnum
CREATE TYPE "LoyaltyRewardType" AS ENUM ('THANK_YOU_CREDIT', 'MILESTONE_PERK', 'PRIORITY_SERVICE', 'EARLY_ACCESS', 'SURPRISE_BONUS', 'COMEBACK_WELCOME');

-- CreateEnum
CREATE TYPE "LoyaltyRewardStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerReferenceType" AS ENUM ('SALE', 'PAYMENT', 'RETURN', 'OPENING_BALANCE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ConsolidatedInvoiceType" AS ENUM ('SINGLE_SUPPLIER', 'MULTI_SUPPLIER', 'PERIOD');

-- CreateEnum
CREATE TYPE "ConsolidatedInvoiceStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SENT', 'ARCHIVED', 'CONFIRMED', 'SENT_TO_SUPPLIER', 'PARTIALLY_PAID', 'PAID', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('DISCONNECTED', 'TEMP_STORED', 'ACTIVE', 'NO_PHONE', 'NEEDS_VERIFICATION', 'ERROR');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'document', 'audio', 'video', 'template', 'interactive', 'location', 'contacts');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'PENDING', 'BOUNCED');

-- CreateEnum
CREATE TYPE "DrugIngestionStatus" AS ENUM ('DRAFT', 'SALT_PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PHARMACIST',
    "approvalPin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pinHash" TEXT,
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "faceDataUrl" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "monthlyRate" DECIMAL(10,2),
    "shiftId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "preferences" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[],
    "data" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "resource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "StoreUser" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreUser_pkey" PRIMARY KEY ("userId","storeId")
);

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
CREATE TABLE "BusinessTypeConfig" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "featureConfig" JSONB NOT NULL,
    "enabledSections" TEXT[],
    "defaultPermissions" TEXT[],
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "businessType" TEXT,
    "logoUrl" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "landmark" TEXT,
    "is24x7" BOOLEAN NOT NULL DEFAULT false,
    "homeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadius" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "dlNumber" TEXT,
    "gstin" TEXT,
    "whatsapp" TEXT,
    "pan" TEXT,
    "featureOverrides" JSONB,
    "bankDetails" JSONB,
    "jurisdiction" TEXT,
    "signatureUrl" TEXT,
    "termsAndConditions" TEXT,
    "whatsappMode" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "rxNumberFormat" TEXT DEFAULT 'RX-NNNNNN',
    "rxNumberPrefix" TEXT DEFAULT 'RX',
    "rxNumberCounter" INTEGER NOT NULL DEFAULT 0,
    "rxYearlyReset" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreLicense" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOperatingHours" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "lunchStart" TEXT,
    "lunchEnd" TEXT,

    CONSTRAINT "StoreOperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "nearExpiryThreshold" INTEGER NOT NULL DEFAULT 90,
    "defaultUoM" TEXT NOT NULL DEFAULT 'Units',
    "defaultGSTSlab" TEXT NOT NULL DEFAULT '12',
    "batchTracking" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateCodes" BOOLEAN NOT NULL DEFAULT true,
    "purchaseRounding" BOOLEAN NOT NULL DEFAULT true,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "invoiceFormat" TEXT NOT NULL DEFAULT 'INV-{YY}{MM}-{SEQ:4}',
    "paymentMethods" TEXT NOT NULL DEFAULT 'Cash',
    "billingType" TEXT NOT NULL DEFAULT 'MRP-based',
    "printFormat" TEXT NOT NULL DEFAULT 'Thermal',
    "footerText" TEXT NOT NULL DEFAULT 'Thank you for your business!',
    "autoRounding" BOOLEAN NOT NULL DEFAULT true,
    "defaultCustomerType" TEXT NOT NULL DEFAULT 'Walk-in',
    "enableGSTBilling" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workbenchMode" TEXT NOT NULL DEFAULT 'SIMPLE',
    "upiId" TEXT,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareDevice" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serialNumber" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "status" TEXT NOT NULL,
    "lastPingAt" TIMESTAMP(3),
    "firmwareVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingCycle" TEXT NOT NULL,
    "patientLimit" INTEGER,
    "prescriptionLimit" INTEGER,
    "storageLimit" INTEGER,
    "multiStore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "planId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeVerticals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "comboBundle" TEXT,
    "monthlyAmount" DECIMAL(10,2),
    "welcomeShown" BOOLEAN NOT NULL DEFAULT false,
    "welcomeShownAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageQuota" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "patientCountUsed" INTEGER NOT NULL DEFAULT 0,
    "prescriptionCountUsed" INTEGER NOT NULL DEFAULT 0,
    "storageMbUsed" INTEGER NOT NULL DEFAULT 0,
    "resetsAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "method" TEXT,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "userId" TEXT,
    "idempotencyKey" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventSource" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "razorpayEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "razorpayStatus" TEXT,
    "apiResponse" JSONB,
    "resolution" TEXT,
    "notes" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "photoUrl" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "bloodGroup" TEXT,
    "allergies" TEXT[],
    "chronicConditions" TEXT[],
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "creditLimit" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'filter',
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "grantedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "digitalSignatureUrl" TEXT,

    CONSTRAINT "PatientConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientInsurance" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "groupNumber" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAdherence" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "expectedRefillDate" TIMESTAMP(3) NOT NULL,
    "actualRefillDate" TIMESTAMP(3),
    "adherenceRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientAdherence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionCheckLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "checkedBy" TEXT NOT NULL,
    "drugIds" TEXT[],
    "hasInteractions" BOOLEAN NOT NULL,
    "severity" TEXT,
    "apiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionCheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLedger" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "referenceType" "LedgerReferenceType" NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" TEXT NOT NULL,
    "rxcui" TEXT,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "strength" TEXT,
    "form" TEXT,
    "manufacturer" TEXT,
    "schedule" TEXT,
    "hsnCode" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "defaultUnit" TEXT,
    "lowStockThreshold" INTEGER,
    "description" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,
    "hsnCodeId" TEXT,
    "baseUnit" TEXT,
    "displayUnit" TEXT,
    "lowStockThresholdBase" DECIMAL(12,3),
    "ingestionStatus" "DrugIngestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripImageUrl" TEXT,
    "ocrMetadata" JSONB,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSlab" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "taxType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSplit" BOOLEAN NOT NULL DEFAULT true,
    "cgstRate" DECIMAL(5,2),
    "sgstRate" DECIMAL(5,2),
    "igstRate" DECIMAL(5,2),
    "cessRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSlab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HsnCode" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "taxSlabId" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HsnCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantityInStock" INTEGER NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "supplierId" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "barcodeType" TEXT,
    "baseUnitQuantity" DECIMAL(12,3),
    "baseUnitReserved" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "internalQRCode" TEXT,
    "looseTabletsCount" INTEGER NOT NULL DEFAULT 0,
    "manufacturerBarcode" TEXT,
    "partialStripsCount" INTEGER NOT NULL DEFAULT 0,
    "receivedQuantity" INTEGER,
    "receivedUnit" TEXT,
    "tabletsPerStrip" INTEGER,

    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseUnitQuantity" DECIMAL(12,3),
    "movementUnit" TEXT,
    "originalQuantity" INTEGER,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantityAdjusted" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "threshold" INTEGER,
    "currentValue" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "countDate" TIMESTAMP(3) NOT NULL,
    "countedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "discrepancies" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryForecast" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedDemand" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "algorithm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriberId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "notes" TEXT,
    "controlledFlag" BOOLEAN NOT NULL DEFAULT false,
    "eRxId" TEXT,
    "eRxMetadata" JSONB,
    "nextRefillDue" TIMESTAMP(3),
    "ocrConfidence" DOUBLE PRECISION,
    "ocrText" TEXT,
    "reminderSent" TIMESTAMP(3),
    "uploadedImages" TEXT[],
    "prescriptionNumber" TEXT NOT NULL,
    "type" "PrescriptionType" NOT NULL DEFAULT 'REGULAR',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "totalRefills" INTEGER NOT NULL DEFAULT 0,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "quantityPrescribed" INTEGER NOT NULL,
    "unit" TEXT,
    "conversionFactor" DECIMAL(10,2),
    "sig" TEXT,
    "daysSupply" INTEGER,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "batchId" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescriber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "clinic" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "specialty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Prescriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionVersion" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "instructions" TEXT,
    "substitutionNotes" TEXT,
    "attachments" JSONB,
    "changedReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItemVersion" (
    "id" TEXT NOT NULL,
    "prescriptionVersionId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantityPrescribed" INTEGER NOT NULL,
    "unit" TEXT,
    "conversionFactor" DECIMAL(10,2),
    "sig" TEXT,
    "daysSupply" INTEGER,
    "substitutionAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrescriptionItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refill" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "refillNumber" INTEGER NOT NULL,
    "authorizedQty" INTEGER NOT NULL,
    "dispensedQty" INTEGER NOT NULL DEFAULT 0,
    "remainingQty" INTEGER NOT NULL,
    "status" "RefillStatus" NOT NULL DEFAULT 'AVAILABLE',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefillItem" (
    "id" TEXT NOT NULL,
    "refillId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "quantityDispensed" INTEGER NOT NULL DEFAULT 0,
    "dispensedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispense" (
    "id" TEXT NOT NULL,
    "refillId" TEXT NOT NULL,
    "prescriptionVersionId" TEXT NOT NULL,
    "status" "DispenseStatus" NOT NULL DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionFile" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "ocrData" JSONB,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseEvent" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "workflowStatus" "DispenseWorkflowStatus" NOT NULL DEFAULT 'INTAKE',
    "intakeBy" TEXT,
    "intakeAt" TIMESTAMP(3),
    "verifyBy" TEXT,
    "verifyAt" TIMESTAMP(3),
    "fillBy" TEXT,
    "fillAt" TIMESTAMP(3),
    "checkBy" TEXT,
    "checkAt" TIMESTAMP(3),
    "releaseBy" TEXT,
    "releaseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DispenseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseItem" (
    "id" TEXT NOT NULL,
    "dispenseEventId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantityDispensed" INTEGER NOT NULL,

    CONSTRAINT "DispenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "locationSnapshot" JSONB,
    "faceVerificationScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "salesAmount" DECIMAL(10,2) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "prescriptionsProcessed" INTEGER NOT NULL DEFAULT 0,
    "prescriptionsVerified" INTEGER NOT NULL DEFAULT 0,
    "prescriptionsRejected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseWorkflowStep" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispenseWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "gstin" TEXT,
    "dlNumber" TEXT,
    "pan" TEXT,
    "contactName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "paymentTerms" TEXT,
    "creditLimit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLicense" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,

    CONSTRAINT "SupplierLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentTerms" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_attachments" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "po_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "packSize" INTEGER NOT NULL DEFAULT 1,
    "packUnit" TEXT NOT NULL DEFAULT 'Strip',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POReceipt" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT NOT NULL,
    "notes" TEXT,
    "itemsReceived" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POReceipt_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "grn_attachments" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "grn_attachments_pkey" PRIMARY KEY ("id")
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
    "expiryDate" TIMESTAMP(3),
    "mrp" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'BEFORE_GST',
    "location" TEXT,
    "isSplit" BOOLEAN NOT NULL DEFAULT false,
    "parentItemId" TEXT,
    "manufacturerBarcode" TEXT,

    CONSTRAINT "GRNItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_discrepancies" (
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

    CONSTRAINT "grn_discrepancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidated_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "type" "ConsolidatedInvoiceType" NOT NULL DEFAULT 'SINGLE_SUPPLIER',
    "status" "ConsolidatedInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "supplierInvoiceDate" TIMESTAMP(3),
    "supplierInvoiceFile" TEXT,
    "supplierInvoiceNo" TEXT,

    CONSTRAINT "consolidated_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidated_invoice_grns" (
    "id" TEXT NOT NULL,
    "consolidatedInvoiceId" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,

    CONSTRAINT "consolidated_invoice_grns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidated_invoice_items" (
    "id" TEXT NOT NULL,
    "consolidatedInvoiceId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "billedQty" INTEGER NOT NULL,
    "disputeNotes" TEXT,
    "expiryDate" TIMESTAMP(3),
    "freeQty" INTEGER NOT NULL DEFAULT 0,
    "grnItemId" TEXT,
    "grnNumber" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "poNumber" TEXT,
    "receivedDate" TIMESTAMP(3),
    "receivedQty" INTEGER NOT NULL,

    CONSTRAINT "consolidated_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_invoice_payments" (
    "id" TEXT NOT NULL,
    "consolidatedInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "supplier_invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReturn" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SupplierReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'RECEIPT',
    "patientId" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "roundOff" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "originalSaleId" TEXT,
    "creditReason" TEXT,
    "soldBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "prescriptionId" TEXT,
    "attachments" JSONB,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "dispenseForPatientId" TEXT,
    "dispenseId" TEXT,
    "buyerGstin" TEXT,
    "placeOfSupply" TEXT,
    "cessAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gstrCategory" TEXT,
    "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isIgst" BOOLEAN NOT NULL DEFAULT false,
    "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "cessAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hsnCode" TEXT,
    "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxSlabId" TEXT,
    "taxableAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseUnitQuantity" DECIMAL(12,3),
    "isPartialSale" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "partialQuantity" INTEGER,
    "partialStripId" TEXT,
    "scanMethod" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "unit" TEXT,
    "originalDrugId" TEXT,
    "substitutedAt" TIMESTAMP(3),
    "substitutionReason" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSplit" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardAuthCode" TEXT,
    "upiTransactionId" TEXT,
    "upiVpa" TEXT,
    "walletProvider" TEXT,
    "walletTxnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceAllocation" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceAllocation_pkey" PRIMARY KEY ("id")
);

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
    "dispenseFor" JSONB,

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

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "gstAmount" DECIMAL(12,2) NOT NULL,
    "tdsAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "attachments" JSONB,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "glAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedSaleId" TEXT,
    "relatedPOId" TEXT,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "reconcileDate" TIMESTAMP(3) NOT NULL,
    "expectedCash" DECIMAL(10,2) NOT NULL,
    "actualCash" DECIMAL(10,2) NOT NULL,
    "difference" DECIMAL(10,2) NOT NULL,
    "cardAmount" DECIMAL(10,2) NOT NULL,
    "upiAmount" DECIMAL(10,2) NOT NULL,
    "walletAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "reconciledBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OCRJob" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "extractedData" JSONB,
    "confidence" DOUBLE PRECISION,
    "vendorCandidates" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OCRJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "txnDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "direction" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bankReference" TEXT NOT NULL,
    "extractedInvoiceIds" TEXT[],
    "extractedUpiId" TEXT,
    "status" TEXT NOT NULL,
    "matchedSaleId" TEXT,
    "matchedExpenseId" TEXT,
    "matchConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSuggestion" (
    "id" TEXT NOT NULL,
    "bankTxnId" TEXT NOT NULL,
    "candidateType" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "MatchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookSecret" TEXT,
    "qrCodeUrl" TEXT,
    "upiVpa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayTransaction" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "saleId" TEXT,
    "providerTxnId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "upiVpa" TEXT,
    "upiTxnId" TEXT,
    "cardLast4" TEXT,
    "cardNetwork" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "utr" TEXT,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTReturn" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GSTReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTTransaction" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "gstin" TEXT,
    "taxableValue" DECIMAL(12,2) NOT NULL,
    "cgst" DECIMAL(10,2) NOT NULL,
    "sgst" DECIMAL(10,2) NOT NULL,
    "igst" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GSTTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IRN" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "irn" TEXT NOT NULL,
    "ackNo" TEXT NOT NULL,
    "ackDate" TIMESTAMP(3) NOT NULL,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IRN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppAccount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "phoneNumber" TEXT,
    "accessToken" TEXT,
    "tempToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "webhookSecret" TEXT,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "businessVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastWebhookReceivedAt" TIMESTAMP(3),
    "businessDisplayName" TEXT,
    "businessAbout" TEXT,
    "businessProfilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarginLedger" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "costPrice" DECIMAL(12,4) NOT NULL,
    "sellingPrice" DECIMAL(12,4) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "marginAmount" DECIMAL(12,2) NOT NULL,
    "marginPercent" DECIMAL(6,2) NOT NULL,
    "isProvisional" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'SALE',
    "notes" TEXT,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarginLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "displayName" TEXT,
    "profilePicUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedAgentId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageBody" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastCustomerMessageAt" TIMESTAMP(3),
    "sessionActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "wabaPhoneNumberId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL,
    "body" TEXT,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaSize" INTEGER,
    "mediaFileName" TEXT,
    "from" TEXT,
    "to" TEXT,
    "status" "MessageStatus",
    "statusReason" TEXT,
    "templateName" TEXT,
    "templateLanguage" TEXT,
    "templateParams" JSONB,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "whatsappAccountId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL DEFAULT 'MARKETING',
    "headerType" TEXT,
    "headerText" TEXT,
    "body" TEXT NOT NULL,
    "footer" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "buttons" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectedReason" TEXT,
    "templateId" TEXT,
    "namespace" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppOutboundQueue" (
    "id" BIGSERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "conversationId" TEXT,
    "payload" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppOutboundQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppFlow" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "successRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessageLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "templateId" TEXT,
    "providerMsgId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSMessageLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "providerMsgId" TEXT NOT NULL,
    "cost" DECIMAL(6,4),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SMSMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "targetAudience" JSONB NOT NULL,
    "messageContent" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTarget" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "CampaignTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "usageLimit" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "benefits" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geolocation" JSONB,
    "loginMethod" TEXT,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'NEW',
    "relatedType" TEXT,
    "relatedId" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionLabel" TEXT,
    "actionUrl" TEXT,
    "blockAction" BOOLEAN NOT NULL DEFAULT false,
    "category" "AlertCategory" NOT NULL DEFAULT 'INVENTORY',
    "channels" "AlertChannel"[] DEFAULT ARRAY['IN_APP']::"AlertChannel"[],
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "seenAt" TIMESTAMP(3),
    "seenBy" TEXT,
    "priority" "AlertPriority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "category" "AlertCategory" NOT NULL,
    "channels" "AlertChannel"[] DEFAULT ARRAY['IN_APP']::"AlertChannel"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "digestMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarcodeRegistry" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "barcodeType" TEXT NOT NULL,
    "manufacturerCode" TEXT,
    "unitType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarcodeRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanAudit" (
    "id" TEXT NOT NULL,
    "barcodeId" TEXT,
    "employeeId" TEXT NOT NULL,
    "saleId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanType" TEXT NOT NULL,
    "deviceType" TEXT,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "ScanAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FEFODeviation" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT,
    "drugId" TEXT NOT NULL,
    "recommendedBatchId" TEXT NOT NULL,
    "actualBatchId" TEXT NOT NULL,
    "deviationDays" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reason" TEXT,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FEFODeviation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeBehaviorMetric" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scanBypassCount" INTEGER NOT NULL DEFAULT 0,
    "voidCount" INTEGER NOT NULL DEFAULT 0,
    "overrideCount" INTEGER NOT NULL DEFAULT 0,
    "fefoDeviationCount" INTEGER NOT NULL DEFAULT 0,
    "manualEntryCount" INTEGER NOT NULL DEFAULT 0,
    "totalSalesCount" INTEGER NOT NULL DEFAULT 0,
    "manualEntryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anomalyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peerRank" INTEGER,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeBehaviorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "overrideType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "originalValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationMapping" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastRestockAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationMismatch" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "expectedLocationId" TEXT NOT NULL,
    "suspectedLocationId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "LocationMismatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartialStripInventory" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "stripIdentifier" TEXT NOT NULL,
    "totalTablets" INTEGER NOT NULL,
    "tabletsRemaining" INTEGER NOT NULL,
    "firstOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSoldAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "PartialStripInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIRequest" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupPlan" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "includeDocuments" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSnapshot" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "checksum" TEXT,
    "recordCounts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BackupSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAudit" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugUnit" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "parentUnit" TEXT,
    "childUnit" TEXT NOT NULL,
    "conversion" DECIMAL(10,3) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "therapeuticClass" TEXT,
    "highRisk" BOOLEAN NOT NULL DEFAULT false,
    "aliases" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugSaltLink" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "saltId" TEXT NOT NULL,
    "strengthValue" DECIMAL(10,3) NOT NULL,
    "strengthUnit" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRIMARY',
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugSaltLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarObject" (
    "sha" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "refCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarObject_pkey" PRIMARY KEY ("sha")
);

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPasswordEncrypted" TEXT,
    "useTLS" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "authMethod" TEXT NOT NULL DEFAULT 'SMTP',
    "gmailAccessToken" TEXT,
    "gmailRefreshToken" TEXT,
    "gmailTokenExpiry" TIMESTAMP(3),
    "oauthConnectedAt" TIMESTAMP(3),

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "to" TEXT[],
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "attachments" JSONB,
    "status" "EmailStatus" NOT NULL,
    "errorMessage" TEXT,
    "sentBy" TEXT NOT NULL,
    "contextType" TEXT,
    "contextId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientRelation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "relatedPatientId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProfile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "LoyaltyStatus" NOT NULL DEFAULT 'NEW',
    "statusSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackCount" INTEGER NOT NULL DEFAULT 0,
    "daysSinceFirst" INTEGER NOT NULL DEFAULT 0,
    "consistencyScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "engagementScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lastPurchaseAt" TIMESTAMP(3),
    "nextMilestoneAt" TIMESTAMP(3),
    "milestoneProgress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "recognitionMessage" TEXT,
    "recognizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "eventType" "LoyaltyEventType" NOT NULL,
    "eventSource" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "frequencyBonus" INTEGER NOT NULL DEFAULT 0,
    "timeBonus" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "LoyaltyRewardType" NOT NULL,
    "status" "LoyaltyRewardStatus" NOT NULL DEFAULT 'LOCKED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minStatus" "LoyaltyStatus",
    "minPoints" INTEGER,
    "creditAmount" DECIMAL(10,2),
    "unlockedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformEmailConfig" (
    "id" TEXT NOT NULL DEFAULT 'platform_email',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authMethod" TEXT NOT NULL DEFAULT 'OAUTH',
    "connectedAt" TIMESTAMP(3),
    "gmailAccessToken" TEXT,
    "gmailEmail" TEXT,
    "gmailRefreshToken" TEXT,
    "gmailTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "PlatformEmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_expiresAt_idx" ON "MagicLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Role_builtIn_idx" ON "Role"("builtIn");

-- CreateIndex
CREATE INDEX "Role_category_idx" ON "Role"("category");

-- CreateIndex
CREATE INDEX "Role_storeId_idx" ON "Role"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "StoreUser_storeId_idx" ON "StoreUser"("storeId");

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
CREATE UNIQUE INDEX "BusinessTypeConfig_businessType_key" ON "BusinessTypeConfig"("businessType");

-- CreateIndex
CREATE INDEX "BusinessTypeConfig_businessType_idx" ON "BusinessTypeConfig"("businessType");

-- CreateIndex
CREATE UNIQUE INDEX "Store_email_key" ON "Store"("email");

-- CreateIndex
CREATE INDEX "Store_email_idx" ON "Store"("email");

-- CreateIndex
CREATE INDEX "Store_deletedAt_idx" ON "Store"("deletedAt");

-- CreateIndex
CREATE INDEX "StoreLicense_storeId_type_idx" ON "StoreLicense"("storeId", "type");

-- CreateIndex
CREATE INDEX "StoreLicense_validTo_idx" ON "StoreLicense"("validTo");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOperatingHours_storeId_dayOfWeek_key" ON "StoreOperatingHours"("storeId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSettings_storeId_key" ON "StoreSettings"("storeId");

-- CreateIndex
CREATE INDEX "StoreSettings_storeId_idx" ON "StoreSettings"("storeId");

-- CreateIndex
CREATE INDEX "HardwareDevice_storeId_status_idx" ON "HardwareDevice"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_storeId_key" ON "Subscription"("storeId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "UsageQuota_subscriptionId_key" ON "UsageQuota"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_storeId_idx" ON "Payment"("storeId");

-- CreateIndex
CREATE INDEX "Payment_razorpayOrderId_idx" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentEvent_eventType_idx" ON "PaymentEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_paymentId_createdAt_key" ON "PaymentEvent"("paymentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_razorpayEventId_key" ON "WebhookEvent"("razorpayEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_processed_idx" ON "WebhookEvent"("eventType", "processed");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_paymentId_idx" ON "PaymentReconciliation"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyCache_key_key" ON "IdempotencyCache"("key");

-- CreateIndex
CREATE INDEX "Patient_storeId_phoneNumber_idx" ON "Patient"("storeId", "phoneNumber");

-- CreateIndex
CREATE INDEX "Patient_storeId_email_idx" ON "Patient"("storeId", "email");

-- CreateIndex
CREATE INDEX "Patient_storeId_lastName_firstName_idx" ON "Patient"("storeId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Patient_storeId_deletedAt_idx" ON "Patient"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "SavedFilter_userId_type_idx" ON "SavedFilter"("userId", "type");

-- CreateIndex
CREATE INDEX "PatientConsent_patientId_type_idx" ON "PatientConsent"("patientId", "type");

-- CreateIndex
CREATE INDEX "PatientInsurance_patientId_idx" ON "PatientInsurance"("patientId");

-- CreateIndex
CREATE INDEX "PatientAdherence_patientId_idx" ON "PatientAdherence"("patientId");

-- CreateIndex
CREATE INDEX "PatientAdherence_expectedRefillDate_idx" ON "PatientAdherence"("expectedRefillDate");

-- CreateIndex
CREATE INDEX "InteractionCheckLog_storeId_prescriptionId_idx" ON "InteractionCheckLog"("storeId", "prescriptionId");

-- CreateIndex
CREATE INDEX "CustomerLedger_patientId_idx" ON "CustomerLedger"("patientId");

-- CreateIndex
CREATE INDEX "CustomerLedger_storeId_idx" ON "CustomerLedger"("storeId");

-- CreateIndex
CREATE INDEX "CustomerLedger_createdAt_idx" ON "CustomerLedger"("createdAt");

-- CreateIndex
CREATE INDEX "Drug_name_idx" ON "Drug"("name");

-- CreateIndex
CREATE INDEX "Drug_hsnCode_idx" ON "Drug"("hsnCode");

-- CreateIndex
CREATE INDEX "Drug_hsnCodeId_idx" ON "Drug"("hsnCodeId");

-- CreateIndex
CREATE INDEX "Drug_storeId_idx" ON "Drug"("storeId");

-- CreateIndex
CREATE INDEX "Drug_storeId_name_idx" ON "Drug"("storeId", "name");

-- CreateIndex
CREATE INDEX "Drug_storeId_hsnCode_idx" ON "Drug"("storeId", "hsnCode");

-- CreateIndex
CREATE INDEX "Drug_storeId_baseUnit_idx" ON "Drug"("storeId", "baseUnit");

-- CreateIndex
CREATE INDEX "TaxSlab_storeId_isActive_idx" ON "TaxSlab"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxSlab_storeId_name_key" ON "TaxSlab"("storeId", "name");

-- CreateIndex
CREATE INDEX "HsnCode_code_idx" ON "HsnCode"("code");

-- CreateIndex
CREATE INDEX "HsnCode_category_idx" ON "HsnCode"("category");

-- CreateIndex
CREATE UNIQUE INDEX "HsnCode_storeId_code_key" ON "HsnCode"("storeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_hsnCode_key" ON "TaxRate"("hsnCode");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_internalQRCode_key" ON "InventoryBatch"("internalQRCode");

-- CreateIndex
CREATE INDEX "InventoryBatch_storeId_drugId_idx" ON "InventoryBatch"("storeId", "drugId");

-- CreateIndex
CREATE INDEX "InventoryBatch_storeId_expiryDate_quantityInStock_idx" ON "InventoryBatch"("storeId", "expiryDate", "quantityInStock");

-- CreateIndex
CREATE INDEX "InventoryBatch_drugId_expiryDate_idx" ON "InventoryBatch"("drugId", "expiryDate");

-- CreateIndex
CREATE INDEX "InventoryBatch_supplierId_createdAt_idx" ON "InventoryBatch"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryBatch_batchNumber_idx" ON "InventoryBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryBatch_storeId_deletedAt_idx" ON "InventoryBatch"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "InventoryBatch_storeId_drugId_baseUnitQuantity_idx" ON "InventoryBatch"("storeId", "drugId", "baseUnitQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_storeId_batchNumber_drugId_key" ON "InventoryBatch"("storeId", "batchNumber", "drugId");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_createdAt_idx" ON "StockMovement"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_referenceType_referenceId_idx" ON "StockMovement"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "StockMovement_userId_createdAt_idx" ON "StockMovement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StockAdjustment_storeId_createdAt_idx" ON "StockAdjustment"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "StockAlert_storeId_status_idx" ON "StockAlert"("storeId", "status");

-- CreateIndex
CREATE INDEX "InventoryCount_storeId_countDate_idx" ON "InventoryCount"("storeId", "countDate");

-- CreateIndex
CREATE INDEX "InventoryForecast_storeId_forecastDate_idx" ON "InventoryForecast"("storeId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryForecast_storeId_drugId_forecastDate_key" ON "InventoryForecast"("storeId", "drugId", "forecastDate");

-- CreateIndex
CREATE INDEX "Prescription_storeId_status_expiryDate_idx" ON "Prescription"("storeId", "status", "expiryDate");

-- CreateIndex
CREATE INDEX "Prescription_patientId_status_createdAt_idx" ON "Prescription"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_prescriberId_createdAt_idx" ON "Prescription"("prescriberId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_storeId_idx" ON "Prescription"("storeId");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_prescriberId_idx" ON "Prescription"("prescriberId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "Prescription_type_idx" ON "Prescription"("type");

-- CreateIndex
CREATE INDEX "Prescription_createdAt_idx" ON "Prescription"("createdAt");

-- CreateIndex
CREATE INDEX "Prescription_deletedAt_idx" ON "Prescription"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_storeId_prescriptionNumber_key" ON "Prescription"("storeId", "prescriptionNumber");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_batchId_idx" ON "PrescriptionItem"("batchId");

-- CreateIndex
CREATE INDEX "Prescriber_storeId_idx" ON "Prescriber"("storeId");

-- CreateIndex
CREATE INDEX "Prescriber_licenseNumber_idx" ON "Prescriber"("licenseNumber");

-- CreateIndex
CREATE INDEX "Prescriber_name_idx" ON "Prescriber"("name");

-- CreateIndex
CREATE INDEX "Prescriber_clinic_idx" ON "Prescriber"("clinic");

-- CreateIndex
CREATE INDEX "Prescriber_storeId_name_idx" ON "Prescriber"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Prescriber_storeId_licenseNumber_key" ON "Prescriber"("storeId", "licenseNumber");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_prescriptionId_idx" ON "PrescriptionVersion"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrescriptionVersion_createdAt_idx" ON "PrescriptionVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionVersion_prescriptionId_versionNumber_key" ON "PrescriptionVersion"("prescriptionId", "versionNumber");

-- CreateIndex
CREATE INDEX "PrescriptionItemVersion_prescriptionVersionId_idx" ON "PrescriptionItemVersion"("prescriptionVersionId");

-- CreateIndex
CREATE INDEX "PrescriptionItemVersion_drugId_idx" ON "PrescriptionItemVersion"("drugId");

-- CreateIndex
CREATE INDEX "PrescriptionItemVersion_batchId_idx" ON "PrescriptionItemVersion"("batchId");

-- CreateIndex
CREATE INDEX "Refill_prescriptionId_idx" ON "Refill"("prescriptionId");

-- CreateIndex
CREATE INDEX "Refill_status_idx" ON "Refill"("status");

-- CreateIndex
CREATE INDEX "Refill_expiresAt_idx" ON "Refill"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Refill_prescriptionId_refillNumber_key" ON "Refill"("prescriptionId", "refillNumber");

-- CreateIndex
CREATE INDEX "RefillItem_refillId_idx" ON "RefillItem"("refillId");

-- CreateIndex
CREATE INDEX "RefillItem_prescriptionItemId_idx" ON "RefillItem"("prescriptionItemId");

-- CreateIndex
CREATE INDEX "Dispense_refillId_idx" ON "Dispense"("refillId");

-- CreateIndex
CREATE INDEX "Dispense_prescriptionVersionId_idx" ON "Dispense"("prescriptionVersionId");

-- CreateIndex
CREATE INDEX "Dispense_status_idx" ON "Dispense"("status");

-- CreateIndex
CREATE INDEX "Dispense_queuedAt_idx" ON "Dispense"("queuedAt");

-- CreateIndex
CREATE INDEX "Dispense_completedAt_idx" ON "Dispense"("completedAt");

-- CreateIndex
CREATE INDEX "PrescriptionFile_prescriptionId_idx" ON "PrescriptionFile"("prescriptionId");

-- CreateIndex
CREATE INDEX "DispenseEvent_prescriptionId_idx" ON "DispenseEvent"("prescriptionId");

-- CreateIndex
CREATE INDEX "DispenseItem_dispenseEventId_idx" ON "DispenseItem"("dispenseEventId");

-- CreateIndex
CREATE INDEX "Shift_storeId_idx" ON "Shift"("storeId");

-- CreateIndex
CREATE INDEX "Shift_storeId_isActive_idx" ON "Shift"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "AttendanceLog_userId_checkInTime_idx" ON "AttendanceLog"("userId", "checkInTime");

-- CreateIndex
CREATE INDEX "AttendanceLog_storeId_checkInTime_idx" ON "AttendanceLog"("storeId", "checkInTime");

-- CreateIndex
CREATE INDEX "AttendanceLog_userId_storeId_checkInTime_idx" ON "AttendanceLog"("userId", "storeId", "checkInTime");

-- CreateIndex
CREATE INDEX "StaffDocument_userId_idx" ON "StaffDocument"("userId");

-- CreateIndex
CREATE INDEX "StaffDocument_userId_status_idx" ON "StaffDocument"("userId", "status");

-- CreateIndex
CREATE INDEX "PerformanceMetric_userId_date_idx" ON "PerformanceMetric"("userId", "date");

-- CreateIndex
CREATE INDEX "PerformanceMetric_storeId_date_idx" ON "PerformanceMetric"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetric_userId_storeId_date_key" ON "PerformanceMetric"("userId", "storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DispenseWorkflowStep_storeId_stepName_key" ON "DispenseWorkflowStep"("storeId", "stepName");

-- CreateIndex
CREATE INDEX "Supplier_gstin_idx" ON "Supplier"("gstin");

-- CreateIndex
CREATE INDEX "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");

-- CreateIndex
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");

-- CreateIndex
CREATE INDEX "Supplier_storeId_status_idx" ON "Supplier"("storeId", "status");

-- CreateIndex
CREATE INDEX "Supplier_storeId_deletedAt_idx" ON "Supplier"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "SupplierLicense_supplierId_idx" ON "SupplierLicense"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_storeId_status_idx" ON "PurchaseOrder"("storeId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_storeId_deletedAt_idx" ON "PurchaseOrder"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "po_attachments_purchaseOrderId_idx" ON "po_attachments"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");

-- CreateIndex
CREATE INDEX "POReceipt_poId_idx" ON "POReceipt"("poId");

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
CREATE INDEX "grn_attachments_grnId_idx" ON "grn_attachments"("grnId");

-- CreateIndex
CREATE INDEX "GRNItem_grnId_idx" ON "GRNItem"("grnId");

-- CreateIndex
CREATE INDEX "GRNItem_poItemId_idx" ON "GRNItem"("poItemId");

-- CreateIndex
CREATE INDEX "GRNItem_parentItemId_idx" ON "GRNItem"("parentItemId");

-- CreateIndex
CREATE INDEX "grn_discrepancies_grnId_idx" ON "grn_discrepancies"("grnId");

-- CreateIndex
CREATE INDEX "grn_discrepancies_reason_idx" ON "grn_discrepancies"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "consolidated_invoices_invoiceNumber_key" ON "consolidated_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "consolidated_invoices_storeId_invoiceDate_idx" ON "consolidated_invoices"("storeId", "invoiceDate");

-- CreateIndex
CREATE INDEX "consolidated_invoices_supplierId_idx" ON "consolidated_invoices"("supplierId");

-- CreateIndex
CREATE INDEX "consolidated_invoices_status_idx" ON "consolidated_invoices"("status");

-- CreateIndex
CREATE INDEX "consolidated_invoice_grns_grnId_idx" ON "consolidated_invoice_grns"("grnId");

-- CreateIndex
CREATE UNIQUE INDEX "consolidated_invoice_grns_consolidatedInvoiceId_grnId_key" ON "consolidated_invoice_grns"("consolidatedInvoiceId", "grnId");

-- CreateIndex
CREATE INDEX "consolidated_invoice_items_consolidatedInvoiceId_idx" ON "consolidated_invoice_items"("consolidatedInvoiceId");

-- CreateIndex
CREATE INDEX "supplier_invoice_payments_consolidatedInvoiceId_idx" ON "supplier_invoice_payments"("consolidatedInvoiceId");

-- CreateIndex
CREATE INDEX "supplier_invoice_payments_paymentDate_idx" ON "supplier_invoice_payments"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReturn_returnNumber_key" ON "SupplierReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "SupplierReturn_poId_idx" ON "SupplierReturn"("poId");

-- CreateIndex
CREATE INDEX "SupplierReturn_storeId_idx" ON "SupplierReturn"("storeId");

-- CreateIndex
CREATE INDEX "SupplierReturn_supplierId_idx" ON "SupplierReturn"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierReturn_status_idx" ON "SupplierReturn"("status");

-- CreateIndex
CREATE INDEX "SupplierReturn_deletedAt_idx" ON "SupplierReturn"("deletedAt");

-- CreateIndex
CREATE INDEX "SupplierReturnItem_returnId_idx" ON "SupplierReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "SupplierReturnItem_drugId_idx" ON "SupplierReturnItem"("drugId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_dispenseId_key" ON "Sale"("dispenseId");

-- CreateIndex
CREATE INDEX "Sale_storeId_createdAt_status_idx" ON "Sale"("storeId", "createdAt", "status");

-- CreateIndex
CREATE INDEX "Sale_storeId_patientId_createdAt_idx" ON "Sale"("storeId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_createdAt_status_idx" ON "Sale"("createdAt", "status");

-- CreateIndex
CREATE INDEX "Sale_soldBy_createdAt_idx" ON "Sale"("soldBy", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_storeId_createdAt_idx" ON "Sale"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_storeId_patientId_idx" ON "Sale"("storeId", "patientId");

-- CreateIndex
CREATE INDEX "Sale_storeId_status_idx" ON "Sale"("storeId", "status");

-- CreateIndex
CREATE INDEX "Sale_invoiceNumber_idx" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Sale_storeId_deletedAt_idx" ON "Sale"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "Sale_paymentStatus_idx" ON "Sale"("paymentStatus");

-- CreateIndex
CREATE INDEX "Sale_placeOfSupply_idx" ON "Sale"("placeOfSupply");

-- CreateIndex
CREATE INDEX "Sale_gstrCategory_idx" ON "Sale"("gstrCategory");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_hsnCode_idx" ON "SaleItem"("hsnCode");

-- CreateIndex
CREATE INDEX "PaymentSplit_saleId_idx" ON "PaymentSplit"("saleId");

-- CreateIndex
CREATE INDEX "InvoiceAllocation_saleId_idx" ON "InvoiceAllocation"("saleId");

-- CreateIndex
CREATE INDEX "InvoiceAllocation_ledgerId_idx" ON "InvoiceAllocation"("ledgerId");

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
CREATE INDEX "Expense_storeId_status_idx" ON "Expense"("storeId", "status");

-- CreateIndex
CREATE INDEX "Expense_storeId_deletedAt_idx" ON "Expense"("storeId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Claim_storeId_status_idx" ON "Claim"("storeId", "status");

-- CreateIndex
CREATE INDEX "Reconciliation_storeId_reconcileDate_idx" ON "Reconciliation"("storeId", "reconcileDate");

-- CreateIndex
CREATE INDEX "OCRJob_storeId_status_idx" ON "OCRJob"("storeId", "status");

-- CreateIndex
CREATE INDEX "BankAccount_storeId_idx" ON "BankAccount"("storeId");

-- CreateIndex
CREATE INDEX "BankTransaction_accountId_txnDate_idx" ON "BankTransaction"("accountId", "txnDate");

-- CreateIndex
CREATE INDEX "BankTransaction_status_idx" ON "BankTransaction"("status");

-- CreateIndex
CREATE INDEX "MatchSuggestion_bankTxnId_idx" ON "MatchSuggestion"("bankTxnId");

-- CreateIndex
CREATE INDEX "PaymentGateway_storeId_status_idx" ON "PaymentGateway"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_providerTxnId_key" ON "GatewayTransaction"("providerTxnId");

-- CreateIndex
CREATE INDEX "GatewayTransaction_gatewayId_status_idx" ON "GatewayTransaction"("gatewayId", "status");

-- CreateIndex
CREATE INDEX "GatewayTransaction_saleId_idx" ON "GatewayTransaction"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_settlementId_key" ON "Settlement"("settlementId");

-- CreateIndex
CREATE INDEX "Settlement_gatewayId_status_idx" ON "Settlement"("gatewayId", "status");

-- CreateIndex
CREATE INDEX "WebhookLog_gatewayId_createdAt_idx" ON "WebhookLog"("gatewayId", "createdAt");

-- CreateIndex
CREATE INDEX "GSTReturn_storeId_period_idx" ON "GSTReturn"("storeId", "period");

-- CreateIndex
CREATE INDEX "GSTTransaction_storeId_transactionType_idx" ON "GSTTransaction"("storeId", "transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "IRN_saleId_key" ON "IRN"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "IRN_irn_key" ON "IRN"("irn");

-- CreateIndex
CREATE INDEX "IRN_irn_idx" ON "IRN"("irn");

-- CreateIndex
CREATE INDEX "ComplianceCheck_storeId_checkType_idx" ON "ComplianceCheck"("storeId", "checkType");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAccount_storeId_key" ON "WhatsAppAccount"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAccount_phoneNumberId_key" ON "WhatsAppAccount"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppAccount_phoneNumberId_idx" ON "WhatsAppAccount"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppAccount_storeId_status_idx" ON "WhatsAppAccount"("storeId", "status");

-- CreateIndex
CREATE INDEX "MarginLedger_storeId_finalizedAt_idx" ON "MarginLedger"("storeId", "finalizedAt");

-- CreateIndex
CREATE INDEX "MarginLedger_saleId_idx" ON "MarginLedger"("saleId");

-- CreateIndex
CREATE INDEX "MarginLedger_drugId_idx" ON "MarginLedger"("drugId");

-- CreateIndex
CREATE INDEX "MarginLedger_batchId_idx" ON "MarginLedger"("batchId");

-- CreateIndex
CREATE INDEX "MarginLedger_type_idx" ON "MarginLedger"("type");

-- CreateIndex
CREATE INDEX "Conversation_storeId_status_idx" ON "Conversation"("storeId", "status");

-- CreateIndex
CREATE INDEX "Conversation_storeId_lastMessageAt_idx" ON "Conversation"("storeId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_assignedAgentId_idx" ON "Conversation"("assignedAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_storeId_phoneNumber_key" ON "Conversation"("storeId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Message_providerMessageId_key" ON "Message"("providerMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_storeId_direction_createdAt_idx" ON "Message"("storeId", "direction", "createdAt");

-- CreateIndex
CREATE INDEX "Message_providerMessageId_idx" ON "Message"("providerMessageId");

-- CreateIndex
CREATE INDEX "Message_wabaPhoneNumberId_idx" ON "Message"("wabaPhoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_storeId_status_idx" ON "WhatsAppTemplate"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_storeId_name_language_key" ON "WhatsAppTemplate"("storeId", "name", "language");

-- CreateIndex
CREATE INDEX "WhatsAppOutboundQueue_storeId_status_runAfter_idx" ON "WhatsAppOutboundQueue"("storeId", "status", "runAfter");

-- CreateIndex
CREATE INDEX "WhatsAppOutboundQueue_status_runAfter_idx" ON "WhatsAppOutboundQueue"("status", "runAfter");

-- CreateIndex
CREATE INDEX "WhatsAppFlow_storeId_active_idx" ON "WhatsAppFlow"("storeId", "active");

-- CreateIndex
CREATE INDEX "WhatsAppConsent_patientId_revokedAt_idx" ON "WhatsAppConsent"("patientId", "revokedAt");

-- CreateIndex
CREATE INDEX "EmailMessageLog_storeId_sentAt_idx" ON "EmailMessageLog"("storeId", "sentAt");

-- CreateIndex
CREATE INDEX "SMSMessageLog_storeId_sentAt_idx" ON "SMSMessageLog"("storeId", "sentAt");

-- CreateIndex
CREATE INDEX "Campaign_storeId_status_idx" ON "Campaign"("storeId", "status");

-- CreateIndex
CREATE INDEX "CampaignTarget_campaignId_status_idx" ON "CampaignTarget"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_validFrom_validTo_idx" ON "Coupon"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_storeId_idx" ON "LoyaltyProgram"("storeId");

-- CreateIndex
CREATE INDEX "AuditLog_storeId_userId_createdAt_idx" ON "AuditLog"("storeId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_storeId_entityType_entityId_idx" ON "AuditLog"("storeId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_userId_createdAt_idx" ON "AccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_eventType_createdAt_idx" ON "AccessLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_loginMethod_createdAt_idx" ON "AccessLog"("loginMethod", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_storeId_status_priority_idx" ON "Alert"("storeId", "status", "priority");

-- CreateIndex
CREATE INDEX "Alert_storeId_category_idx" ON "Alert"("storeId", "category");

-- CreateIndex
CREATE INDEX "Alert_storeId_status_severity_idx" ON "Alert"("storeId", "status", "severity");

-- CreateIndex
CREATE INDEX "Alert_snoozeUntil_idx" ON "Alert"("snoozeUntil");

-- CreateIndex
CREATE INDEX "Alert_seenAt_idx" ON "Alert"("seenAt");

-- CreateIndex
CREATE INDEX "Alert_expiresAt_idx" ON "Alert"("expiresAt");

-- CreateIndex
CREATE INDEX "Alert_relatedType_relatedId_idx" ON "Alert"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "AlertPreference_userId_storeId_idx" ON "AlertPreference"("userId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_userId_storeId_category_key" ON "AlertPreference"("userId", "storeId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "BarcodeRegistry_barcode_key" ON "BarcodeRegistry"("barcode");

-- CreateIndex
CREATE INDEX "BarcodeRegistry_barcode_idx" ON "BarcodeRegistry"("barcode");

-- CreateIndex
CREATE INDEX "BarcodeRegistry_batchId_idx" ON "BarcodeRegistry"("batchId");

-- CreateIndex
CREATE INDEX "BarcodeRegistry_barcodeType_idx" ON "BarcodeRegistry"("barcodeType");

-- CreateIndex
CREATE INDEX "ScanAudit_employeeId_scannedAt_idx" ON "ScanAudit"("employeeId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanAudit_barcodeId_scannedAt_idx" ON "ScanAudit"("barcodeId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanAudit_storeId_scannedAt_idx" ON "ScanAudit"("storeId", "scannedAt");

-- CreateIndex
CREATE INDEX "FEFODeviation_employeeId_createdAt_idx" ON "FEFODeviation"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "FEFODeviation_drugId_createdAt_idx" ON "FEFODeviation"("drugId", "createdAt");

-- CreateIndex
CREATE INDEX "FEFODeviation_storeId_createdAt_idx" ON "FEFODeviation"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "EmployeeBehaviorMetric_date_anomalyScore_idx" ON "EmployeeBehaviorMetric"("date", "anomalyScore");

-- CreateIndex
CREATE INDEX "EmployeeBehaviorMetric_storeId_date_idx" ON "EmployeeBehaviorMetric"("storeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeBehaviorMetric_employeeId_date_idx" ON "EmployeeBehaviorMetric"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeBehaviorMetric_employeeId_storeId_date_key" ON "EmployeeBehaviorMetric"("employeeId", "storeId", "date");

-- CreateIndex
CREATE INDEX "OperationOverride_employeeId_timestamp_idx" ON "OperationOverride"("employeeId", "timestamp");

-- CreateIndex
CREATE INDEX "OperationOverride_overrideType_timestamp_idx" ON "OperationOverride"("overrideType", "timestamp");

-- CreateIndex
CREATE INDEX "OperationOverride_storeId_timestamp_idx" ON "OperationOverride"("storeId", "timestamp");

-- CreateIndex
CREATE INDEX "Location_storeId_isActive_idx" ON "Location"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_storeId_name_key" ON "Location"("storeId", "name");

-- CreateIndex
CREATE INDEX "LocationMapping_locationId_idx" ON "LocationMapping"("locationId");

-- CreateIndex
CREATE INDEX "LocationMapping_storeId_idx" ON "LocationMapping"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationMapping_drugId_locationId_key" ON "LocationMapping"("drugId", "locationId");

-- CreateIndex
CREATE INDEX "LocationMismatch_drugId_detectedAt_idx" ON "LocationMismatch"("drugId", "detectedAt");

-- CreateIndex
CREATE INDEX "LocationMismatch_storeId_detectedAt_resolvedAt_idx" ON "LocationMismatch"("storeId", "detectedAt", "resolvedAt");

-- CreateIndex
CREATE INDEX "PartialStripInventory_batchId_tabletsRemaining_idx" ON "PartialStripInventory"("batchId", "tabletsRemaining");

-- CreateIndex
CREATE INDEX "PartialStripInventory_storeId_tabletsRemaining_idx" ON "PartialStripInventory"("storeId", "tabletsRemaining");

-- CreateIndex
CREATE INDEX "APIKey_storeId_revokedAt_idx" ON "APIKey"("storeId", "revokedAt");

-- CreateIndex
CREATE INDEX "APIRequest_apiKeyId_createdAt_idx" ON "APIRequest"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "APIRequest_createdAt_idx" ON "APIRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_storeId_active_idx" ON "WebhookEndpoint"("storeId", "active");

-- CreateIndex
CREATE INDEX "BackupPlan_storeId_active_idx" ON "BackupPlan"("storeId", "active");

-- CreateIndex
CREATE INDEX "BackupSnapshot_storeId_createdAt_idx" ON "BackupSnapshot"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_storeId_entityType_entityId_idx" ON "Document"("storeId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "PatientAudit_patientId_createdAt_idx" ON "PatientAudit"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugUnit_drugId_isDefault_idx" ON "DrugUnit"("drugId", "isDefault");

-- CreateIndex
CREATE INDEX "DrugUnit_drugId_baseUnit_idx" ON "DrugUnit"("drugId", "baseUnit");

-- CreateIndex
CREATE UNIQUE INDEX "DrugUnit_drugId_parentUnit_childUnit_key" ON "DrugUnit"("drugId", "parentUnit", "childUnit");

-- CreateIndex
CREATE UNIQUE INDEX "Salt_name_key" ON "Salt"("name");

-- CreateIndex
CREATE INDEX "Salt_name_idx" ON "Salt"("name");

-- CreateIndex
CREATE INDEX "Salt_category_idx" ON "Salt"("category");

-- CreateIndex
CREATE INDEX "Salt_highRisk_idx" ON "Salt"("highRisk");

-- CreateIndex
CREATE INDEX "Salt_createdById_idx" ON "Salt"("createdById");

-- CreateIndex
CREATE INDEX "DrugSaltLink_drugId_idx" ON "DrugSaltLink"("drugId");

-- CreateIndex
CREATE INDEX "DrugSaltLink_saltId_idx" ON "DrugSaltLink"("saltId");

-- CreateIndex
CREATE INDEX "DrugSaltLink_saltId_strengthValue_strengthUnit_idx" ON "DrugSaltLink"("saltId", "strengthValue", "strengthUnit");

-- CreateIndex
CREATE INDEX "DrugSaltLink_drugId_role_idx" ON "DrugSaltLink"("drugId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "DrugSaltLink_drugId_saltId_key" ON "DrugSaltLink"("drugId", "saltId");

-- CreateIndex
CREATE INDEX "UserAvatar_userId_isActive_idx" ON "UserAvatar"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserAvatar_sha_idx" ON "UserAvatar"("sha");

-- CreateIndex
CREATE INDEX "AvatarObject_refCount_idx" ON "AvatarObject"("refCount");

-- CreateIndex
CREATE INDEX "EmailAccount_storeId_isPrimary_idx" ON "EmailAccount"("storeId", "isPrimary");

-- CreateIndex
CREATE INDEX "EmailAccount_email_idx" ON "EmailAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_storeId_email_key" ON "EmailAccount"("storeId", "email");

-- CreateIndex
CREATE INDEX "EmailTemplate_emailAccountId_idx" ON "EmailTemplate"("emailAccountId");

-- CreateIndex
CREATE INDEX "EmailTemplate_emailAccountId_category_idx" ON "EmailTemplate"("emailAccountId", "category");

-- CreateIndex
CREATE INDEX "EmailLog_emailAccountId_createdAt_idx" ON "EmailLog"("emailAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_contextType_contextId_idx" ON "EmailLog"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "PatientRelation_patientId_idx" ON "PatientRelation"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRelation_patientId_relatedPatientId_key" ON "PatientRelation"("patientId", "relatedPatientId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProfile_patientId_key" ON "LoyaltyProfile"("patientId");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_patientId_idx" ON "LoyaltyProfile"("patientId");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_storeId_status_idx" ON "LoyaltyProfile"("storeId", "status");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_storeId_updatedAt_idx" ON "LoyaltyProfile"("storeId", "updatedAt");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_profileId_createdAt_idx" ON "LoyaltyEvent"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_storeId_eventType_createdAt_idx" ON "LoyaltyEvent"("storeId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyReward_profileId_status_idx" ON "LoyaltyReward"("profileId", "status");

-- CreateIndex
CREATE INDEX "LoyaltyReward_storeId_type_idx" ON "LoyaltyReward"("storeId", "type");

