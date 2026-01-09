# Production Deployment & Monitoring Guide
## First 10 Live Payments - Quality Assurance

**Status:** Ready for production deployment  
**Date:** January 9, 2026  
**Blocker Issues:** 0

---

## 🚀 PRE-DEPLOYMENT CHECKLIST

### Environment Variables (CRITICAL)

**Backend (.env on Render):**
```bash
# Verify these are set:
✅ RAZORPAY_MODE=live
✅ RAZORPAY_KEY_ID=rzp_live_xxxxx
✅ RAZORPAY_KEY_SECRET=your_live_secret
✅ RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
✅ NODE_ENV=production
✅ FRONTEND_URL=https://hoperxpharma.vercel.app
✅ COOKIE_SECURE=true
✅ DATABASE_URL=postgresql://... (production DB)
```

**Frontend (.env on Vercel):**
```bash
# These should NOT exist (backend provides keys):
❌ Remove any NEXT_PUBLIC_RAZORPAY_* variables
✅ NEXT_PUBLIC_API_URL=https://backend.onrender.com
```

### Database Migration

```bash
# 1. Connect to production database
cd backend

# 2. Generate Prisma client
npx prisma generate

# 3. Check migration status
npx prisma migrate status

# 4. If pending migrations, apply them
npx prisma migrate deploy

# 5. Verify schema
npx prisma db pull
```

### Razorpay Configuration

1. **Generate Live API Keys:**
   - Go to https://dashboard.razorpay.com
   - Switch to LIVE mode (top right)
   - Settings → API Keys → Generate Key Pair
   - Copy `Key ID` and `Key Secret`

2. **Configure Webhook:**
   - Settings → Webhooks → Add New Webhook
   - URL: `https://your-backend.onrender.com/api/v1/payments/webhooks/razorpay`
   - Events: Select all:
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `order.paid`
     - ✅ `refund.processed`
     - ✅ `dispute.created`
   - Copy Webhook Secret

3. **Test Webhook Delivery:**
   - After deployment, send test webhook from Razorpay dashboard
   - Check backend logs for successful receipt

---

## 📦 DEPLOYMENT STEPS

### Step 1: Commit All Changes

```bash
cd /Users/dikshantjangra/Desktop/hoperxpharma

# Check what's changed
git status

# Add all payment system files
git add backend/src/services/paymentService.js
git add backend/src/services/webhookService.js
git add backend/src/services/subscriptionActivationService.js
git add backend/src/controllers/paymentController.js
git add backend/src/routes/v1/payment.routes.js
git add backend/src/middlewares/rateLimiting.js
git add backend/src/middlewares/payment.validation.js
git add backend/src/jobs/*.js
git add backend/src/constants/payment.constants.js
git add backend/src/config/razorpay.config.js
git add backend/prisma/schema.prisma
git add backend/scripts/seedSubscriptionPlans.js
git add src/services/api/payment.api.js
git add src/components/BillingPage.jsx
git add src/components/PaymentHistory.jsx
git add docs/*.md

# Commit
git commit -m "feat: production-grade Razorpay payment system with webhook verification, reconciliation, and audit trails"
```

### Step 2: Push to Production

```bash
# Push to main branch (triggers auto-deploy)
git push origin main
```

### Step 3: Verify Deployment

**Backend (Render):**
1. Go to Render dashboard
2. Check deployment logs
3. Verify "Deploy succeeded" message
4. Check environment variables are set

**Frontend (Vercel):**
1. Go to Vercel dashboard
2. Check deployment logs
3. Verify build succeeded

### Step 4: Seed Subscription Plans

```bash
# SSH into Render instance or run via Render shell
cd backend
node scripts/seedSubscriptionPlans.js
```

**Expected Output:**
```
✅ Created: Retail Pharmacy - Monthly (₹299)
✅ Created: Retail Pharmacy - Yearly (₹2999)
✅ Created: Wholesale Pharmacy - Monthly (₹499)
✅ Created: Wholesale Pharmacy - Yearly (₹4999)
✅ Created: Hospital Pharmacy - Monthly (₹999)
✅ Created: Hospital Pharmacy - Yearly (₹9999)
✅ All 6 subscription plans seeded successfully!
```

### Step 5: Smoke Test (Before Live Payments)

**Test with ₹1 Plan (Create Temporary):**

```sql
-- Connect to production DB
INSERT INTO "SubscriptionPlan" (id, name, "displayName", price, currency, "billingCycle", status, features, "verticalType", "createdAt", "updatedAt")
VALUES (
  'test_1_rupee',
  'test_1_rupee',
  'Test ₹1 Plan',
  1,
  'INR',
  'monthly',
  'ACTIVE',
  '["Testing only"]',
  'retail',
  NOW(),
  NOW()
);
```

**Make Test Payment:**
1. Go to billing page
2. Select test plan
3. Complete payment with live card (₹1)
4. Verify success
5. Check subscription activated
6. Immediately refund via Razorpay dashboard

**Delete Test Plan:**
```sql
DELETE FROM "SubscriptionPlan" WHERE id = 'test_1_rupee';
```

---

## 📊 MONITORING FIRST 10 LIVE PAYMENTS

### Real-Time Monitoring Dashboard

**Create SQL View:**
```sql
CREATE VIEW payment_monitoring AS
SELECT 
    p.id,
    p."createdAt",
    p.status,
    p."amountPaise" / 100.0 AS amount_rupees,
    p.method,
    p."razorpayOrderId",
    p."razorpayPaymentId",
    s.name AS store_name,
    u.email AS user_email,
    p.metadata->>'planName' AS plan_name,
    EXTRACT(EPOCH FROM (p."completedAt" - p."createdAt")) / 60 AS completion_time_minutes
FROM "Payment" p
LEFT JOIN "Store" s ON s.id = p."storeId"
LEFT JOIN "User" u ON u.id = p."userId"
WHERE p."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY p."createdAt" DESC
LIMIT 10;
```

**Monitor Query:**
```sql
SELECT * FROM payment_monitoring;
```

### Per-Payment Checklist

For each of the first 10 payments, verify:

**Payment #1-10:**
```
Payment ID: _______________
Created: _______________
Amount: ₹_______________

✅ Payment created (INITIATED status)
✅ Razorpay order ID exists
✅ User completed checkout
✅ Signature verified (PROCESSING status)
✅ Webhook received (check WebhookEvent table)
✅ Payment marked SUCCESS
✅ Subscription activated
✅ completedAt timestamp set
✅ PaymentEvent entries created
✅ No errors in logs

Average time INITIATED → SUCCESS: _______ seconds
Any issues: _______________________
```

### Automated Monitoring Queries

**Query 1: Payment Success Rate**
```sql
SELECT 
    COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
    COUNT(*) FILTER (WHERE status = 'PROCESSING') AS stuck,
    COUNT(*) AS total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / COUNT(*), 2) AS success_rate_percent
FROM "Payment"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

**Expected:** success_rate > 90%

**Query 2: Webhook Processing**
```sql
SELECT 
    "eventType",
    COUNT(*) AS total,
    SUM(CASE WHEN processed THEN 1 ELSE 0 END) AS processed,
    SUM(CASE WHEN "processingError" IS NOT NULL THEN 1 ELSE 0 END) AS errors
FROM "WebhookEvent"
WHERE "receivedAt" > NOW() - INTERVAL '24 hours'
GROUP BY "eventType";
```

**Expected:** processed = total for all event types

**Query 3: Subscription Activation**
```sql
SELECT 
    p.id AS payment_id,
    p.status AS payment_status,
    s.status AS subscription_status,
    s."currentPeriodStart",
    s."currentPeriodEnd"
FROM "Payment" p
LEFT JOIN "Subscription" s ON s."storeId" = p."storeId"
WHERE p.status = 'SUCCESS'
  AND p."createdAt" > NOW() - INTERVAL '24 hours';
```

**Expected:** All SUCCESS payments have ACTIVE subscription

**Query 4: Amount Verification**
```sql
SELECT 
    p.id,
    p."amountPaise",
    sp.price * 100 AS expected_amount_paise,
    p."amountPaise" = sp.price * 100 AS amount_matches
FROM "Payment" p
JOIN "SubscriptionPlan" sp ON sp.id = p.metadata->>'planId'
WHERE p."createdAt" > NOW() - INTERVAL '24 hours';
```

**Expected:** All rows have `amount_matches = true`

---

## 🚨 ALERT TRIGGERS

### Critical Alerts (Immediate Action Required)

**Alert 1: Payment Stuck >1 Hour**
```sql
SELECT id, "createdAt", status, "amountPaise" / 100.0 AS amount
FROM "Payment"
WHERE status IN ('PROCESSING', 'INITIATED')
  AND "createdAt" < NOW() - INTERVAL '1 hour';
```

**Action:** Manually trigger reconciliation

**Alert 2: Webhook Processing Failure**
```sql
SELECT * FROM "WebhookEvent"
WHERE processed = false
  AND "receivedAt" < NOW() - INTERVAL '30 minutes';
```

**Action:** Check error, manually reprocess if needed

**Alert 3: Amount Mismatch Detected**
```sql
SELECT * FROM "PaymentEvent"
WHERE "rawPayload"::jsonb->'securityEvent' = '"WEBHOOK_AMOUNT_MISMATCH"'
  AND "createdAt" > NOW() - INTERVAL '24 hours';
```

**Action:** Investigate immediately - possible fraud attempt

**Alert 4: Subscription Not Activated**
```sql
SELECT p.*
FROM "Payment" p
LEFT JOIN "Subscription" s ON s."storeId" = p."storeId"
WHERE p.status = 'SUCCESS'
  AND p."completedAt" > NOW() - INTERVAL '1 hour'
  AND (s.id IS NULL OR s.status != 'ACTIVE');
```

**Action:** Check subscription activation logs, manual activation if needed

### Warning Alerts (Monitor, Not Urgent)

**Warning 1: High Failure Rate**
```sql
-- If >10% of payments failing
SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'FAILED') / COUNT(*), 2)
FROM "Payment"
WHERE "createdAt" > NOW() - INTERVAL '1 hour';
```

**Warning 2: Slow Payment Processing**
```sql
-- Average time >60 seconds
SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")))
FROM "Payment"
WHERE status = 'SUCCESS'
  AND "completedAt" > NOW() - INTERVAL '1 hour';
```

---

## 📈 SUCCESS METRICS

### After First 10 Payments

**Targets:**
- ✅ Success rate: >90%
- ✅ Average completion time: <30 seconds
- ✅ Webhook processing: 100%
- ✅ Zero amount mismatches
- ✅ Zero stuck payments >1 hour
- ✅ All subscriptions activated

**If all targets met:** Enable for all users

**If any target missed:** 
1. Document issue
2. Fix root cause
3. Monitor next 10 payments
4. Repeat until targets met

---

## 🔧 TROUBLESHOOTING

### Issue: Payment Stuck in PROCESSING

**Diagnosis:**
```sql
SELECT * FROM "Payment" WHERE id = 'payment_id';
SELECT * FROM "WebhookEvent" WHERE "rawPayload"::jsonb->'payment'->'entity'->>'order_id' = 'razorpay_order_id';
SELECT * FROM "PaymentEvent" WHERE "paymentId" = 'payment_id' ORDER BY "createdAt" DESC;
```

**Fix:**
```bash
# Manual reconciliation
curl -X POST https://your-api.com/api/v1/payments/reconcile/payment_id \
  -H "Authorization: Bearer admin_token"
```

### Issue: Webhook Not Received

**Check Razorpay Dashboard:**
1. Go to Webhooks section
2. Find webhook delivery log
3. Check status (delivered/failed)
4. If failed, check error message

**Resend from Razorpay:**
1. Click on failed webhook
2. Click "Resend"

### Issue: Subscription Not Activated

**Check:**
```sql
SELECT * FROM "Subscription" WHERE "storeId" = 'store_id';
SELECT * FROM "PaymentEvent" WHERE "paymentId" = 'payment_id' AND "eventType" = 'payment_captured';
```

**Manual Activation:**
```javascript
// Run in Node REPL with Prisma client
await subscriptionActivationService.activateSubscription(
    'store_id',
    paymentMetadata,
    amountPaise,
    prisma
);
```

---

## 📞 ESCALATION CONTACTS

**Technical Issues:**
- Backend errors: Check Render logs
- Frontend errors: Check Vercel logs + browser console
- Database issues: Check Neon dashboard

**Payment Issues:**
- Razorpay support: support@razorpay.com
- Razorpay dashboard: https://dashboard.razorpay.com

**Emergency Rollback:**
```bash
# If critical issue found:
git revert HEAD
git push origin main

# Disable payment routes:
# Comment out payment routes in backend/src/routes/v1/index.js
```

---

## ✅ POST-MONITORING ACTIONS

**After successful monitoring of first 10 payments:**

1. **Document Learnings:**
   - Average payment completion time
   - Most common payment methods
   - Any edge cases encountered

2. **Optimize Based on Data:**
   - Adjust reconciliation threshold if needed
   - Fine-tune timeout values

3. **Enable for All Users:**
   - Remove any feature flags
   - Announce to users

4. **Set Up Ongoing Monitoring:**
   - Daily payment success rate report
   - Weekly reconciliation summary
   - Monthly dispute review

**PAYMENT SYSTEM IS PRODUCTION-READY! 🚀**
