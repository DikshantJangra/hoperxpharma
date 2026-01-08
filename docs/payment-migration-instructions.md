# Database Migration Instructions

## ⚠️ IMPORTANT - READ BEFORE RUNNING

This migration will:
1. Add `PaymentStatus` enum with 8 states
2. Modify the `Payment` table structure
3. Create `PaymentEvent`, `WebhookEvent`, `PaymentReconciliation`, `IdempotencyCache` tables  
4. Rename `PaymentStatus` enum to `InvoicePaymentStatus` for invoice payments
5. Add many database indices for performance

**This will RESET your development database and delete all existing data.**

---

## Prerequisites

✅ **Backup your database** (if you have important data)
```bash
pg_dump -U postgres -d hoperxpharma > backup_$(date +%Y%m%d_%H%M%S).sql
```

✅ **Verify you're in development environment**
```bash
echo $NODE_ENV  # Should be 'development' or empty
```

✅ **Database is running**
```bash
# Test connection
psql -U postgres -d hoperxpharma -c "SELECT 1"
```

---

## Option 1: Run Migration (Recommended for Development)

This will reset the database and apply all changes.

```bash
cd backend

# Run migration with database reset
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Create tables from schema
# 3. Run all migrations
# 4 . Run seed scripts (if configured)
```

**After migration:**
```bash
# Seed subscription plans
node scripts/seedSubscriptionPlans.js

# Verify tables were created
npx prisma studio
# Check for: Payment, PaymentEvent, WebhookEvent, PaymentReconciliation, IdempotencyCache
```

---

## Option 2: Create Migration Without Running

If you want to review the SQL first:

```bash
cd backend

# Create migration file only
npx prisma migrate dev --create-only --name add_production_payment_system

# View the migration SQL
cat prisma/migrations/*_add_production_payment_system/migration.sql

# After reviewing, apply it:
npx prisma migrate deploy
```

---

## Option 3: Production Deployment

For production environments (DO NOT reset database):

```bash
cd backend

# Deploy migrations only (no reset)
npx prisma migrate deploy

# This will apply pending migrations without dropping data
```

---

## Verification

After running migration, verify everything is working:

### 1. Check Database Schema

```bash
npx prisma db pull
```

### 2. Verify New Tables

```sql
-- Connect to database
psql -U postgres -d hoperxpharma

-- List all tables
\dt

-- Verify Payment table structure
\d "Payment"

-- Verify new tables exist
\d "PaymentEvent"
\d "WebhookEvent"
\d "PaymentReconciliation"
\d "IdempotencyCache"

-- Check PaymentStatus enum
\dT+ "PaymentStatus"
```

### 3. Seed Subscription Plans

```bash
node scripts/seedSubscriptionPlans.js
```

Expected output:
```
🌱 Seeding subscription plans...
   ✅ Retail Pharmacy - Monthly (₹299/monthly)
   ✅ Retail Pharmacy - Yearly (₹2999/yearly)
   ✅ Wholesale Pharmacy - Monthly (₹499/monthly)
   ✅ Wholesale Pharmacy - Yearly (₹4999/yearly)
   ✅ Hospital Pharmacy - Monthly (₹999/monthly)
   ✅ Hospital Pharmacy - Yearly (₹9999/yearly)
   ✅ Multi-Chain - Custom (₹0/monthly)
✅ Subscription plans seeded successfully!
```

### 4. Verify Application Starts

```bash
npm run dev
```

Check console for:
```
✅ Database connected
[JobScheduler] Initializing background jobs...
[ReconciliationJob] Scheduled successfully
[ExpirationJob] Scheduled successfully
✅ Payment background jobs initialized
Server is running on port http://localhost:8000
```

---

## Troubleshooting

### Error: "Database does not exist"

```bash
# Create database
createdb -U postgres hoperxpharma

# Then run migration again
npm prisma migrate deploy
```

### Error: "Database is not empty"

```bash
# Use reset instead of migrate
npx prisma migrate reset
```

### Error: "Invalid migration"

```bash
# Clear migration lock
npx prisma migrate resolve --rolled-back "*"

# Try again
npx prisma migrate deploy
```

### Error: "Enum already exists"

This means the migration was partially applied. Fix:

```bash
# Connect to database
psql -U postgres -d hoperxpharma

# Drop conflicting enum
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;

# Exit and run migration again
npx prisma migrate reset
```

---

## Post-Migration Checklist

After successful migration:

- [ ] All tables created successfully
- [ ] PaymentStatus enum exists with 8 values
- [ ] InvoicePaymentStatus enum exists (renamed from old PaymentStatus)
- [ ] Subscription plans seeded (7 plans)
- [ ] Application starts without errors
- [ ] Background jobs initialize
- [ ] Can create a test payment order (API test)

---

## Next Steps

After successful migration:

1. **Test Payment Flow**
   - Create a payment order via API
   - Verify it's stored in database
   - Check PaymentEvent table for audit log

2. **Configure Razorpay**
   - Add live keys to `.env`
   - Set up webhook URL
   - Test webhook delivery

3. **Deploy to Production**
   - Follow deployment guide
   - Test with ₹1 payments
   - Monitor for 24 hours

---

## Rollback (If Needed)

If migration fails and you need to rollback:

### From Backup

```bash
# Drop current database
dropdb -U postgres hoperxpharma

# Create fresh database
createdb -U postgres hoperxpharma

# Restore from backup
psql -U postgres -d hoperxpharma < backup_YYYYMMDD_HHMMSS.sql
```

### To Previous Migration

```bash
# Mark current migration as rolled back
npx prisma migrate resolve --rolled-back "20XXXXXX_add_production_payment_system"

# Reset to previous state
npx prisma migrate reset
```

---

## Support

If you encounter issues:

1. Check error messages carefully
2. Verify database connection
3. Ensure Prisma CLI is up to date: `npm install -g prisma@latest`
4. Review migration SQL file manually
5. Check database logs: `tail -f /path/to/postgres/logs`

**Common Issues:**
- Permission errors: Run with proper database user
- Connection timeout: Check DATABASE_URL in `.env`
- Type conflicts: Drop conflicting types manually
- Lock errors: Clear migration lock with `prisma migrate resolve`

---

## Quick Reference

```bash
# Full reset (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy

# Create migration file only
npx prisma migrate dev --create-only

# View appliedmigrations
npx prisma migrate status

# Seed subscription plans
node scripts/seedSubscriptionPlans.js

# Open Prisma Studio (view data)
npx prisma studio
```

---

**🚀 Ready to migrate!**
