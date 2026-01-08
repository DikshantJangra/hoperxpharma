-- Migration to add payment system without data loss
-- Step 1: Add new columns as NULLABLE first
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountPaise" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- Step 2: Migrate existing data (convert amount to paise)
UPDATE "Payment" 
SET "amountPaise" = CAST(COALESCE("amount", 0) * 100 AS INTEGER)
WHERE "amountPaise" IS NULL;

-- Step 3: Set default values for other fields
UPDATE "Payment" 
SET "userId" = (
  SELECT "userId" FROM "Subscription" 
  WHERE "Subscription"."storeId" = "Payment"."storeId" 
  LIMIT 1
)
WHERE "userId" IS NULL;

-- Step 4: Now make amountPaise required
ALTER TABLE "Payment" ALTER COLUMN "amountPaise" SET NOT NULL;

-- Step 5: Rename old status values to new enum
UPDATE "Payment" 
SET "status" = 'SUCCESS' 
WHERE "status" = 'COMPLETED';

UPDATE "Payment" 
SET "status" = 'PROCESSING' 
WHERE "status" = 'PENDING';

-- Step 6: Create new tables
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
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

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
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

CREATE TABLE IF NOT EXISTS "PaymentReconciliation" (
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

CREATE TABLE IF NOT EXISTS "IdempotencyCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyCache_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_paymentId_createdAt_key" ON "PaymentEvent"("paymentId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_eventType_idx" ON "PaymentEvent"("eventType");

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_razorpayEventId_key" ON "WebhookEvent"("razorpayEventId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_eventType_processed_idx" ON "WebhookEvent"("eventType", "processed");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_paymentId_idx" ON "PaymentReconciliation"("paymentId");

CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyCache_key_key" ON "IdempotencyCache"("key");

-- Step 8: Add foreign keys
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Create unique constraint for idempotencyKey
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
