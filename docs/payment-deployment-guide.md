# Razorpay Payment System - Deployment Guide

## Prerequisites

Before deploying the payment system to production:

- [ ] Razorpay KYC verification complete
- [ ] Live Razorpay API keys generated
- [ ] Webhook secret obtained from Razorpay Dashboard
- [ ] Production database ready
- [ ] Environment variables configured
- [ ] SSL/HTTPS configured for webhook endpoint
- [ ] All tests passing

---

## Step 1: Run Database Migration

The payment system requires new database tables and schema changes.

```bash
cd backend

# IMPORTANT: This will modify your database schema
# Back up your database before proceeding

# Run migration
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

**What gets created:**
- `PaymentStatus` enum with 8 states
- Updated `Payment` table with state machine
- `PaymentEvent` table for audit logging
- `WebhookEvent` table for idempotency
- `PaymentReconciliation` table for stuck payment tracking
- `IdempotencyCache` table for API-level deduplication
- `InvoicePaymentStatus` enum (renamed from `PaymentStatus` for invoices)

---

## Step 2: Seed Subscription Plans

```bash
# Seed default subscription plans
node scripts/seedSubscriptionPlans.js
```

**Plans created:**
- Retail Monthly: ₹299
- Retail Yearly: ₹2999  (17% discount)
- Wholesale Monthly: ₹499
- Wholesale Yearly: ₹4999 (17% discount)
- Hospital Monthly: ₹999
- Hospital Yearly: ₹9999 (17% discount)
- Multi-chain: Custom pricing

---

## Step 3: Configure Environment Variables

### Update `.env` for Production

```bash
# Razorpay Configuration (PRODUCTION)
RAZORPAY_MODE=live
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx        # From Razorpay Dashboard
RAZORPAY_KEY_SECRET=your_live_secret_here      # Keep this SECRET
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx    # From webhook settings

# Important: Never commit these to git!
```

### Generate Live Keys

1. Go to Razorpay Dashboard → Settings → API Keys
2. Click "Generate Live Keys"
3. Download and store securely
4. Add to environment variables

### Webhook Secret

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create new webhook endpoint
3. URL: `https://yourdomain.com/api/v1/payments/webhooks/razorpay`
4. Events to subscribe:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
   - `refund.processed`
   - `dispute.created`
5. Copy webhook secret
6. Add to `.env` as `RAZORPAY_WEBHOOK_SECRET`

---

## Step 4: Test with ₹1 Payments

**CRITICAL: Test in live mode before going fully live**

### Test Flow

```javascript
// 1. Create test ₹1 plan (temporary)
await prisma.subscriptionPlan.create({
  data: {
    name: 'test_live',
    displayName: 'Test Live Payment',
    price: 1,  // ₹1
    currency: 'INR',
    billingCycle: 'monthly'
  }
});

// 2. Make ₹1 payment through your app
// 3. Verify entire flow works:
//    - Order creation ✅
//    - Razorpay checkout ✅
//    - Signature verification ✅
//    - Webhook received ✅
//    - Payment marked SUCCESS ✅
//    - Subscription activated ✅

// 4. Immediately refund the ₹1
// Dashboard → Payments → Refund

// 5. Delete test plan
await prisma.subscriptionPlan.delete({
  where: { name: 'test_live' }
});
```

### Verification Checklist

After ₹1 test payment:

- [ ] Payment appears in Razorpay Dashboard
- [ ] Webhook event received (check logs)
- [ ] Payment status: SUCCESS in database
- [ ] PaymentEvent entries created
- [ ] WebhookEvent stored
- [ ] Subscription status: ACTIVE
- [ ] Refund processed successfully

---

## Step 5: Verify Background Jobs

Background jobs should auto-start when server starts.

### Check Job Initialization

```bash
# Server logs should show:
# [JobScheduler] Initializing background jobs...
# [ReconciliationJob] Scheduled successfully
# [ExpirationJob] Scheduled successfully
# ✅ Payment background jobs initialized
```

### Test Reconciliation Job

```javascript
// Manually trigger reconciliation
const { runReconciliationNow } = require('./src/jobs/paymentReconciliation.job');
await runReconciliationNow();
```

### Test Expiration Job

```javascript
// Manually trigger expiration
const { runExpirationNow } = require('./src/jobs/paymentExpiration.job');
await runExpirationNow();
```

---

## Step 6: Monitoring & Alerts

### Set Up Monitoring

1. **Payment Metrics Dashboard**
   - Success rate (target: >95%)
   - Average processing time
   - Webhook delivery rate
   - Stuck payments count

2. **Critical Alerts**
   ```javascript
   // Configure alerts for:
   - Stuck payments (> 30 mins in PROCESSING)
   - Webhook failures
   - Amount mismatches
   - High failure rate (> 10%)
   - Disputed payments
   ```

3. **Log Monitoring**
   ```bash
   # Watch for critical errors
   tail -f logs/error.log | grep "Payment"
   tail -f logs/combined.log | grep "Webhook"
   ```

### Health Check Endpoint

```bash
# Add payment health check
GET /api/v1/payments/health

Response:
{
  "status": "healthy",
  "razorpayMode": "live",
  "backgroundJobs": {
    "reconciliation": "running",
    "expiration": "running"
  },
  "lastPayment": "2026-01-08T17:00:00Z"
}
```

---

## Step 7: Go-Live Checklist

### Pre-Launch Verification

**Security:**
- [ ] Webhook signature verification working
- [ ] Rate limiting active on all payment endpoints
- [ ] HTTPS enforced for all payment routes
- [ ] CORS restricted to frontend domain only
- [ ] Secrets never logged or exposed
- [ ] SQL injection protection (queries use Prisma)

**Functionality:**
- [ ] Payment order creation works
- [ ] Razorpay checkout opens correctly
- [ ] Signature verification succeeds
- [ ] Webhooks received and processed
- [ ] Payments marked SUCCESS correctly
- [ ] Subscriptions activated
- [ ] Reconciliation job runs
- [ ] Expiration job runs

**Data Integrity:**
- [ ] Amount calculated  server-side (never trust client)
- [ ] State transitions enforced
- [ ] Audit logs complete
- [ ] Idempotency working
- [ ] No duplicate processing

**Recovery:**
- [ ] Stuck payments reconciled automatically
- [ ] Manual reconciliation endpoint works
- [ ] Webhook failures handled
- [ ] Old orders expired correctly

**Business:**
- [ ] Subscription plans seeded
- [ ] Pricing correct for all plans
- [ ] Billing cycles configured
- [ ] Trial period handles correctly

### Launch Day

1. **8:00 AM** - Final system check
2. **9:00 AM** - Enable live mode
3. **9:30 AM** - Monitor first real payment
4. **12:00 PM** - Check for stuck payments
5. **6:00 PM** - Review metrics
6. **11:00 PM** - 24-hour health check

### First 24 Hours

**Hourly Checks:**
- Payment success rate
- Webhook delivery rate
- Stuck payments count
- Error logs

**If Issues Arise:**
1. Check webhook logs first
2. Run manual reconciliation if needed
3. Verify Razorpay Dashboard matches DB
4. Check for amount mismatches
5. Review PaymentEvent audit trail

---

## Step 8: Rollback Plan

If critical issues occur:

### Immediate Actions

```bash
# 1. Disable payment endpoints (maintenance mode)
# Add to .env
PAYMENT_MAINTENANCE_MODE=true

# 2. Stop processing new payments
# 3. Let background jobs continue (webhook processing)
# 4. DON'T stop the server (webhooks still need to be received)
```

### Data Safety

- All payments are logged in `PaymentEvent` table
- Raw webhooks stored in `WebhookEvent` table
- No data loss possible
- Stuck payments can be manually reconciled

### Recovery Steps

```bash
# 1. Fix the issue
# 2. Run reconciliation for stuck payments
  npm run reconcile-payments

# 3. Verify all payments settled
SELECT status, COUNT(*) 
FROM \"Payment\" 
WHERE \"createdAt\" > NOW() - INTERVAL '24 hours'
GROUP BY status;

# 4. Re-enable payment endpoints
# Remove PAYMENT_MAINTENANCE_MODE from .env

# 5. Resume normal operations
```

---

## Step 9: Post-Launch Monitoring

### Daily Tasks

```bash
# 1. Check payment metrics
SELECT 
  status,
  COUNT(*) as count,
  SUM(\"amountPaise\") / 100 as total_rupees
FROM \"Payment\"
WHERE \"createdAt\" >= CURRENT_DATE
GROUP BY status;

# 2. Check stuck payments
SELECT COUNT(*) 
FROM \"Payment\"
WHERE status = 'PROCESSING'
AND \"updatedAt\" < NOW() - INTERVAL '30 minutes';

# 3. Verify webhook processing
SELECT 
  processed,
  COUNT(*) 
FROM \"WebhookEvent\"
WHERE \"receivedAt\" >= CURRENT_DATE
GROUP BY processed;
```

### Weekly Tasks

- Review payment success rate trends
- Analyze failure reasons
- Check reconciliation job effectiveness
- Review security logs for suspicious activity
- Verify subscription activation accuracy

### Monthly Tasks

- Audit payment event logs
- Review chargeback/dispute rate
- Analyze payment method distribution
- Check for payment fraud patterns
- Update rate limits if needed

---

## Troubleshooting

### Common Issues

**Issue: Payment stuck in PROCESSING**
```bash
# Solution: Run manual reconciliation
POST /api/v1/payments/reconcile/:paymentId
```

**Issue: Webhook not received**
```bash
# Check:
1. Webhook URL is correct in Razorpay Dashboard
2. Endpoint is publicly accessible (not localhost)
3. HTTPS is working
4. Signature verification not failing
5. Check Razorpay webhook logs in Dashboard
```

**Issue: Amount mismatch error**
```bash
# This is a SECURITY event
# Check PaymentEvent table for security_event entries
SELECT * FROM \"PaymentEvent\"
WHERE \"rawPayload\"::text LIKE '%AMOUNT_MISMATCH%';

# Investigate the source
# Do NOT ignore these
```

**Issue: Background jobs not running**
```bash
# Check server logs for initialization
# Restart server to reinitialize jobs
# Verify node-cron is installed
npm list node-cron
```

---

## Support & Escalation

### Critical Issues (Immediate Response)

- Webhook endpoint down
- Mass payment failures
- Security breach detected
- Amount mismatch events
- Database connection issues

**Action:** Roll back to maintenance mode, investigate immediately

### High Priority (< 1 hour)

- Individual stuck payment
- Reconciliation job fails
- Webhook signature failures
- Rate limit issues

**Action:** Manual investigation and resolution

### Normal Priority (< 24 hours)

- Payment history display issues
- Frontend polling timeout
- Minor logging issues

**Action:** Standard debugging process

---

## Success Metrics

Your payment system is successful if:

✅ **Payment Success Rate > 95%**
✅ **Webhook Delivery Rate = 100%**
✅ **Stuck Payments = 0** (reconciled within 30 mins)
✅ **Zero False Positives** (no incorrect SUCCESS states)
✅ **Complete Audit Trail** (all events logged)
✅ **Zero Security Events** (no tampering detected)

---

## Final Notes

**Remember:**
- Payments are NOT features - they are financial contracts
- Backend is the ONLY source of truth
- Never trust frontend for payment success
- Webhooks are mandatory - no exceptions
- Security over convenience - always

**Support Contacts:**
- Razorpay Support: support@razorpay.com
- Razorpay Dashboard: https://dashboard.razorpay.com
- Documentation: https://razorpay.com/docs/

---

## Quick Reference

```bash
# Seed subscription plans
node scripts/seedSubscriptionPlans.js

# Run migration
npx prisma migrate deploy

# Check payment status
SELECT status, COUNT(*) FROM \"Payment\" GROUP BY status;

# Reconcile stuck payment
POST /api/v1/payments/reconcile/:paymentId

# View webhook events
SELECT * FROM \"WebhookEvent\" ORDER BY \"receivedAt\" DESC LIMIT 10;

# View payment audit trail
SELECT * FROM \"PaymentEvent\" 
WHERE \"paymentId\" = 'xxx' 
ORDER BY \"createdAt\" DESC;
```

**🚀 You're ready for production!**
