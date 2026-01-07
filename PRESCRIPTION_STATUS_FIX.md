# Prescription Status & POS Import Fix Summary

## Issues Fixed

### 1. ✅ Prescription Status Not Updating (VERIFIED → ACTIVE/COMPLETED)

**Problem:**
- ONE_TIME prescriptions (totalRefills = 0) stayed in VERIFIED status after full dispense
- Partial dispenses didn't move prescription to ACTIVE status
- Status update logic had timing issues with refill exhaustion checks

**Root Cause:**
- `updatePrescriptionStatus` was called BEFORE refill status was updated to FULLY_USED
- The check for exhausted refills happened too early in the transaction
- Redundant status update calls caused race conditions

**Solution:**
1. **Modified `refillService.updateRefillAfterDispense`** (refillService.js)
   - Now automatically triggers `updatePrescriptionStatus` when refill becomes FULLY_USED
   - Ensures status update happens AFTER refill is marked exhausted
   - Clamps remainingQty to minimum of 0

2. **Simplified `prescriptionService.updatePrescriptionStatus`** (prescriptionService.js)
   - Removed redundant ONE_TIME failsafe logic (now handled by areAllRefillsExhausted)
   - Cleaner logic: EXPIRED → COMPLETED → ACTIVE → VERIFIED
   - Only checks VERIFIED status for ACTIVE transition (prevents unnecessary checks)

3. **Removed redundant call in `saleService.createSaleFromDispense`** (saleService.js)
   - Status update now happens automatically via refillService
   - Prevents double-update race conditions

**Flow After Fix:**
```
Sale Created → Dispense Completed → Refill Updated → Status Auto-Updated
                                    ↓
                            (if FULLY_USED) → updatePrescriptionStatus()
```

---

### 2. ✅ POS Medication Importing Broken

**Problem:**
- "Import from Prescription" feature in POS was failing
- Items from verified prescriptions couldn't be loaded into cart

**Root Cause:**
- `parseFloat(item.quantityPrescribed)` was accessing nested object incorrectly
- Missing optional chaining for `item.drug.gstRate` caused crashes
- Prisma Decimal/Int fields needed explicit Number() conversion

**Solution:**
Modified `saleService.createSaleFromDispense` (saleService.js):
- Changed `parseFloat()` to `Number()` for better type handling
- Added proper variable extraction before mapping
- Added optional chaining for `item.drug?.gstRate`
- Ensured both `quantity` and `originalQuantity` are properly converted to numbers

**Code Change:**
```javascript
// Before (broken):
quantity: parseFloat(saleData.itemQuantities?.[item.drugId] || item.quantityPrescribed),
gstRate: enableGSTBilling ? (item.drug.gstRate || defaultGSTRate) : 0,

// After (fixed):
const quantity = saleData.itemQuantities?.[item.drugId] || item.quantityPrescribed;
return {
    quantity: Number(quantity),
    gstRate: enableGSTBilling ? (item.drug?.gstRate || defaultGSTRate) : 0,
    originalQuantity: Number(item.quantityPrescribed)
};
```

---

## Files Modified

1. **backend/src/services/prescriptions/refillService.js**
   - Added auto-trigger of prescription status update when refill exhausted
   - Added prescription include in findUnique query

2. **backend/src/services/prescriptions/prescriptionService.js**
   - Simplified status update logic
   - Removed redundant ONE_TIME failsafe
   - Improved VERIFIED → ACTIVE transition

3. **backend/src/services/sales/saleService.js**
   - Fixed item quantity parsing with proper Number() conversion
   - Added optional chaining for drug.gstRate
   - Removed redundant updatePrescriptionStatus call
   - Updated comment numbering

4. **backend/src/services/prescriptions/dispenseService.js**
   - Added prescription include in completeDispense query
   - Improved logging

---

## Testing & Migration

### Test Script
Run to verify the fix works:
```bash
cd backend
node test-status-update.js
```

This will:
- Find ONE_TIME and REPEAT prescriptions
- Check for stuck prescriptions in VERIFIED with activity
- Display current status and refill data

### Migration Script
Run to fix existing stuck prescriptions:
```bash
cd backend
node fix-stuck-prescriptions.js
```

This will:
- Find all prescriptions stuck in VERIFIED with dispensed refills
- Update them to ACTIVE or COMPLETED based on refill status
- Create audit logs for each fix
- Display summary of changes

---

## Expected Behavior After Fix

### ONE_TIME Prescriptions (totalRefills = 0)
1. Created → Status: DRAFT
2. Verified → Status: VERIFIED
3. Partial Dispense → Status: ACTIVE
4. Full Dispense → Status: COMPLETED ✅

### REPEAT Prescriptions (totalRefills > 0)
1. Created → Status: DRAFT
2. Verified → Status: VERIFIED
3. First Dispense (Refill #0) → Status: ACTIVE ✅
4. Refill #0 Exhausted → Status: ACTIVE (more refills available)
5. All Refills Exhausted → Status: COMPLETED ✅

### POS Import
1. Click "Import from Prescription" in POS
2. Search for verified prescription
3. Select prescription
4. Items load into cart with correct quantities ✅
5. Prices and batches can be edited
6. Sale completes successfully ✅

---

## Verification Checklist

- [ ] Run test script to identify any stuck prescriptions
- [ ] Run migration script to fix existing issues
- [ ] Create a new ONE_TIME prescription
- [ ] Verify it, then dispense fully via POS
- [ ] Confirm status changes: VERIFIED → ACTIVE → COMPLETED
- [ ] Create a REPEAT prescription (1+ refills)
- [ ] Dispense first refill partially
- [ ] Confirm status changes: VERIFIED → ACTIVE
- [ ] Test POS import feature with verified prescription
- [ ] Confirm items load correctly with quantities
- [ ] Complete sale and verify prescription status updates

---

## Notes

- Status updates now happen automatically via the refill service
- No manual status update calls needed in sale/dispense flows
- Audit logs are created for all status changes
- Migration script is idempotent (safe to run multiple times)
- Test script is read-only (safe to run anytime)

---

## Rollback Plan

If issues occur, revert these commits:
1. refillService.js - Remove auto-trigger of updatePrescriptionStatus
2. prescriptionService.js - Restore previous updatePrescriptionStatus logic
3. saleService.js - Restore parseFloat and add back manual status update call
4. dispenseService.js - Remove prescription include

Then restart the backend service.
