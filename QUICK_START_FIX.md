# Quick Start: Testing Prescription Status Fixes

## 🚀 Immediate Actions

### 1. Fix Existing Stuck Prescriptions (Run First!)
```bash
cd backend
node fix-stuck-prescriptions.js
```

**What it does:**
- Finds prescriptions stuck in VERIFIED with dispensed refills
- Updates them to ACTIVE or COMPLETED
- Creates audit logs for tracking

**Expected Output:**
```
🔧 Fixing Stuck Prescription Statuses

Found 3 prescriptions to fix

✅ Fixed RX000021: VERIFIED → COMPLETED (All refills dispensed)
✅ Fixed RX000022: VERIFIED → ACTIVE (Dispensing started)

📊 Summary:
   Total Fixed: 2
   → ACTIVE: 1
   → COMPLETED: 1
```

---

### 2. Verify the Fix Works
```bash
cd backend
node test-status-update.js
```

**What it does:**
- Shows current state of prescriptions
- Identifies any remaining stuck prescriptions
- Displays refill status details

**Expected Output:**
```
🧪 Testing Prescription Status Update Logic

✅ Found ONE_TIME prescription: RX000021
   Status: COMPLETED
   Total Refills: 0
   Main Refill Status: FULLY_USED

✅ No prescriptions stuck in VERIFIED with activity
```

---

### 3. Test POS Import Feature

1. **Start your backend** (if not running):
   ```bash
   cd backend
   npm run dev
   ```

2. **Open POS in browser**:
   - Navigate to POS module
   - Click "Import from Prescription" button

3. **Search and Import**:
   - Search for a verified prescription
   - Click to import
   - Verify items load into cart ✅

4. **Complete Sale**:
   - Adjust quantities/prices if needed
   - Complete payment
   - Check prescription status updates automatically ✅

---

## 🧪 Manual Testing Scenarios

### Scenario A: ONE_TIME Prescription (No Refills)
1. Create new prescription with 0 refills
2. Verify it (status → VERIFIED)
3. Import into POS and dispense 50% of quantity
4. **Expected:** Status → ACTIVE ✅
5. Complete remaining 50%
6. **Expected:** Status → COMPLETED ✅

### Scenario B: REPEAT Prescription (With Refills)
1. Create new prescription with 1 refill
2. Verify it (status → VERIFIED)
3. Import into POS and dispense first refill fully
4. **Expected:** Status → ACTIVE ✅
5. Create second refill and dispense
6. **Expected:** Status → COMPLETED ✅

---

## 🐛 Troubleshooting

### Issue: Migration script shows 0 prescriptions found
**Solution:** Good! This means no prescriptions are stuck.

### Issue: POS import still not working
**Check:**
1. Backend is running and accessible
2. Browser console for JavaScript errors
3. Network tab for API call failures
4. Backend logs for error messages

**Debug:**
```bash
# Check backend logs
cd backend
npm run dev

# In another terminal, check for errors:
tail -f logs/combined.log
```

### Issue: Status still not updating
**Check:**
1. Refill record exists for prescription
2. Refill status is being updated (check database)
3. Backend logs show "Prescription X status changed" message

**Manual Fix:**
```sql
-- Check refill status
SELECT id, prescriptionId, refillNumber, status, dispensedQty, remainingQty 
FROM Refill 
WHERE prescriptionId = 'YOUR_PRESCRIPTION_ID';

-- Check prescription status
SELECT id, prescriptionNumber, status, totalRefills 
FROM Prescription 
WHERE id = 'YOUR_PRESCRIPTION_ID';
```

---

## 📊 Monitoring

### Check Audit Logs
```sql
SELECT * FROM AuditLog 
WHERE entityType = 'Prescription' 
  AND action LIKE 'PRESCRIPTION_%'
ORDER BY createdAt DESC 
LIMIT 10;
```

### Check Refill Status
```sql
SELECT 
    p.prescriptionNumber,
    p.status as prescriptionStatus,
    r.refillNumber,
    r.status as refillStatus,
    r.dispensedQty,
    r.remainingQty
FROM Prescription p
JOIN Refill r ON r.prescriptionId = p.id
WHERE p.status IN ('VERIFIED', 'ACTIVE')
ORDER BY p.createdAt DESC;
```

---

## ✅ Success Indicators

- [ ] Migration script runs without errors
- [ ] Test script shows no stuck prescriptions
- [ ] POS import loads prescription items
- [ ] Partial dispense changes status to ACTIVE
- [ ] Full dispense changes status to COMPLETED
- [ ] Audit logs show status change events
- [ ] No JavaScript errors in browser console
- [ ] Backend logs show successful status updates

---

## 📞 Need Help?

If issues persist:
1. Check `PRESCRIPTION_STATUS_FIX.md` for detailed technical info
2. Review backend logs in `backend/logs/`
3. Check browser console for frontend errors
4. Verify database schema matches expected structure

---

## 🔄 Restart Services

If you made changes while services were running:

```bash
# Restart backend
cd backend
# Press Ctrl+C to stop
npm run dev

# Restart frontend (if needed)
cd ..
# Press Ctrl+C to stop
npm run dev
```

---

**Last Updated:** January 2026
**Fix Version:** v1.0
