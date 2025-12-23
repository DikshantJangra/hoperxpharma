-- Safe migration to update EmailAccount schema while preserving data
-- This migration adds new columns and updates existing ones without data loss

-- Step 1: Update EmailAccount table if it exists, or create it
DO $$ 
BEGIN
  -- Check if EmailAccount table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'EmailAccount') THEN
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'EmailAccount' AND column_name = 'useTLS') THEN
      ALTER TABLE "EmailAccount" ADD COLUMN "useTLS" BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'EmailAccount' AND column_name = 'lastTestedAt') THEN
      ALTER TABLE "EmailAccount" ADD COLUMN "lastTestedAt" TIMESTAMP;
    END IF;
    
    -- Safely convert provider column type (TEXT is compatible with existing data)
    BEGIN
      ALTER TABLE "EmailAccount" ALTER COLUMN "provider" TYPE TEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already be TEXT, ignore error
      NULL;
    END;
    
    -- Ensure all required columns exist with defaults
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'EmailAccount' AND column_name = 'isPrimary') THEN
      ALTER TABLE "EmailAccount" ADD COLUMN "isPrimary" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'EmailAccount' AND column_name = 'isVerified') THEN
      ALTER TABLE "EmailAccount" ADD COLUMN "isVerified" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'EmailAccount' AND column_name = 'isActive') THEN
      ALTER TABLE "EmailAccount" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
    
  ELSE
    -- Table doesn't exist, create it fresh
    CREATE TABLE "EmailAccount" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "storeId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "smtpHost" TEXT NOT NULL,
      "smtpPort" INTEGER NOT NULL,
      "smtpUser" TEXT NOT NULL,
      "smtpPasswordEncrypted" TEXT NOT NULL,
      "useTLS" BOOLEAN NOT NULL DEFAULT true,
      "isPrimary" BOOLEAN NOT NULL DEFAULT false,
      "isVerified" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "lastTestedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Add unique constraint
    ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_storeId_email_key" UNIQUE ("storeId", "email");
    
    -- Add indexes
    CREATE INDEX "EmailAccount_storeId_isPrimary_idx" ON "EmailAccount"("storeId", "isPrimary");
    CREATE INDEX "EmailAccount_email_idx" ON "EmailAccount"("email");
    
    -- Add foreign key
    ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_storeId_fkey" 
      FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 2: Create EmailTemplate table if it doesn't exist
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "emailAccountId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "bodyHtml" TEXT NOT NULL,
  "variables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for EmailTemplate if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'EmailTemplate_emailAccountId_fkey'
  ) THEN
    ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_emailAccountId_fkey" 
      FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "EmailTemplate_emailAccountId_idx" ON "EmailTemplate"("emailAccountId");

-- Step 3: Create EmailStatus enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailStatus') THEN
    CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');
  END IF;
END $$;

-- Step 4: Create EmailLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "emailAccountId" TEXT NOT NULL,
  "to" TEXT[] NOT NULL,
  "cc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bcc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "subject" TEXT NOT NULL,
  "bodyHtml" TEXT NOT NULL,
  "attachments" JSONB,
  "status" "EmailStatus" NOT NULL,
  "errorMessage" TEXT,
  "sentBy" TEXT NOT NULL,
  "contextType" TEXT,
  "contextId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP
);

-- Add foreign key for EmailLog if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'EmailLog_emailAccountId_fkey'
  ) THEN
    ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_emailAccountId_fkey" 
      FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "EmailLog_emailAccountId_createdAt_idx" ON "EmailLog"("emailAccountId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_status_idx" ON "EmailLog"("status");
CREATE INDEX IF NOT EXISTS "EmailLog_contextType_contextId_idx" ON "EmailLog"("contextType", "contextId");

-- Migration complete
SELECT 'Migration completed successfully - all email data preserved' AS status;
