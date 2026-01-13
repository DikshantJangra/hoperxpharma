# Quick Deployment Guide - v3.1

## 🚀 Ready to Deploy!

All critical issues are fixed. Follow these steps to deploy to production.

---

## ⚡ Quick Steps

### 1. Deploy Code (5 minutes)
```bash
# Build production bundle
npm run build

# Deploy to your hosting
# (Vercel, AWS, Docker, etc.)
```

### 2. Run Cleanup Script (2 minutes)
```bash
# Test first (no changes)
node scripts/cleanup-walkin-patients.js --dry-run

# Review output, then run for real
node scripts/cleanup-walkin-patients.js
```

### 3. Verify (3 minutes)
- Open production URL
- Test PO receiving
- Test POS walk-in sale
- Check logs

**Total Time**: ~10 minutes

---

## ✅ What's Fixed

### Inventory Receiving
- ✅ Live status badges
- ✅ "IN STOCK" stickers
- ✅ No data loss on fast clicks
- ✅ Split batches in card view
- ✅ QR codes everywhere

### Walk-in Customer Bug
- ✅ No more duplicate patients
- ✅ Single walk-in per store
- ✅ Clean database

---

## 🧪 Quick Test

### Test 1: Inventory Receiving
1. Open pending PO
2. Click "Receive"
3. Enter existing batch number
4. See "📦 IN STOCK" sticker
5. Change batch number
6. See badge update live
7. Click "Complete Receiving"
8. Verify success

**Expected**: No errors, data saved correctly

### Test 2: Walk-in Sale
1. Create POS sale without patient
2. Complete sale
3. Check logs: "Reusing existing walk-in patient"
4. Create another walk-in sale
5. Check logs: Same message
6. Verify: No new patient created

**Expected**: Same walk-in patient reused

---

## 📊 Cleanup Script Output

### Dry Run (Safe)
```bash
node scripts/cleanup-walkin-patients.js --dry-run
```

**Shows**:
- How many duplicates found
- Which patients will be kept
- Which will be deleted
- How many sales will be migrated
- **NO CHANGES MADE**

### Live Run (Applies Changes)
```bash
node scripts/cleanup-walkin-patients.js
```

**Does**:
- Keeps oldest walk-in patient per store
- Migrates all sales to kept patient
- Soft-deletes duplicates
- Logs all changes

---

## 🔍 Verify Cleanup

### Check Walk-in Patients
```sql
SELECT 
    s."name" as store_name,
    p."phoneNumber",
    COUNT(sa.id) as sales_count
FROM "Patient" p
JOIN "Store" s ON p."storeId" = s.id
LEFT JOIN "Sale" sa ON sa."patientId" = p.id
WHERE p."phoneNumber" = 'WALKIN-CUSTOMER'
    AND p."deletedAt" IS NULL
GROUP BY s."name", p."phoneNumber";
```

**Expected**: 1 walk-in patient per store

### Check for Duplicates
```sql
SELECT 
    "storeId",
    COUNT(*) as count
FROM "Patient"
WHERE "phoneNumber" LIKE 'WALKIN-%'
    AND "deletedAt" IS NULL
GROUP BY "storeId"
HAVING COUNT(*) > 1;
```

**Expected**: No results (no duplicates)

---

## 📝 Logs to Monitor

### Success Logs
```
✅ "Reusing existing walk-in patient"
✅ "GRN completed successfully"
✅ "Sale created successfully"
```

### Warning Logs
```
⚠️  "Creating new walk-in patient" (only once per store)
⚠️  "Validation failed" (user error, not system)
```

### Error Logs
```
❌ "Insufficient stock" (expected business logic)
❌ "Batch not found" (expected validation)
```

---

## 🆘 Rollback (If Needed)

### Quick Rollback
```bash
# Revert code changes
git revert HEAD
git push origin main

# Redeploy previous version
```

### Cleanup Rollback
- Cleanup uses soft delete (deletedAt)
- Can be reversed by setting deletedAt = NULL
- Sales migrations are in database (can be reverted)

---

## 📞 Need Help?

### Check Documentation
1. `PRODUCTION_READY_v3.1.md` - Full overview
2. `WALKIN_CUSTOMER_FIX.md` - Walk-in bug details
3. `INVENTORY_AUDIT_PART1_GROUND_TRUTH.md` - System architecture

### Common Issues

**Issue**: Cleanup script fails
**Fix**: Check database connection, run with --dry-run first

**Issue**: Walk-in sales not working
**Fix**: Check logs, verify patientId is null/undefined

**Issue**: Inventory badges not updating
**Fix**: Clear browser cache, check network tab

---

## 🎉 You're Ready!

Everything is tested and documented. Deploy with confidence!

**Version**: 3.1
**Status**: ✅ PRODUCTION READY
**Risk**: LOW
**Time**: ~10 minutes

---

**Go ahead and deploy! 🚀**

