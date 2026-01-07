# DPFV Test Failures - Fix Instructions

## Context
You are fixing failing test scenarios in the HopeRxPharma backend DPFV (Deterministic Product Flow Verifier) test suite. The test report is in `dpfv-report.json`. Currently: **11 PASSED, 12 FAILED, 1 BLOCKED**.

## Debugging Approach

### 1. Read the Error Pattern
- Check `dpfv-report.json` → `failures` array for error details
- Look for "Context key not found" errors = missing service implementation
- Look for "Assertion failed" = logic/validation issue
- Look for Prisma errors = schema mismatch

### 2. Locate the Failing Step
```bash
# Find the step implementation
grep -r "stepId_from_report" verifier/steps/
# Example: grep -r "gdpr.export-json" verifier/steps/
```

### 3. Check Service Implementation
- If context key missing → service didn't set the value
- Find service: `src/services/` or `src/repositories/`
- Check if function exists and returns expected data

### 4. Fix Pattern
- Add missing field to service response
- Set context value: `ctx.set('keyName', value)`
- Ensure service function is exported and imported correctly

## Failures to Fix (Priority Order)

### 🔴 CRITICAL - pos.quick-sale (HIGH BUSINESS IMPACT)
**Error**: Context key "sale" not found  
**Step**: `verifier/steps/pos.steps.ts` → `createQuickSale`  
**Root Cause**: Sale creation failing, not setting context  
**Fix**:
1. Check `src/services/sales/saleService.js` → `createQuickSale` method
2. Verify it returns sale object
3. Ensure `ctx.set('sale', sale)` is called in step
4. Check for any thrown errors in service (prescription/dispense creation)

---

### 🟡 MEDIUM - clinical.dispense (BLOCKS pos.rx-sale)
**Error**: Expected status "PENDING", got "QUEUED"  
**Step**: `verifier/steps/dispense.steps.ts` → `createDispense`  
**Root Cause**: Status mismatch in dispense creation  
**Fix**:
1. Check `src/services/prescriptions/dispenseService.js` → `createDispense`
2. Change initial status from "QUEUED" to "PENDING"
3. Or update test expectation in `verifier/scenarios/clinical/dispense.flow.ts`

---

### 🟡 MEDIUM - Setup Failures (5 scenarios)
**Scenarios**: pos.refund, pos.credit, documents.invoice-pdf, procurement.consolidated, pos.draft  
**Error**: All fail at setup step  
**Root Cause**: Missing store creation with required fields  
**Fix**:
1. Check `verifier/steps/` for each scenario's setup step
2. Ensure `addressLine1` is provided when creating store
3. Add default values for required fields

**Example Fix**:
```typescript
// In setup step
const store = await onboardingSteps.createStore(ctx, {
  name: "Test Store",
  addressLine1: "123 Test St", // ADD THIS
  // ... other fields
});
```

---

### 🟡 MEDIUM - audit.gdpr
**Error**: Context key "gdprExport" not found  
**Step**: `verifier/steps/gdpr.steps.ts` → export step  
**Fix**:
1. Check if `src/services/gdpr/dataExportService.js` → `collectUserData` is called
2. Ensure result is set: `ctx.set('gdprExport', exportData)`
3. Verify service returns data (already fixed User.name → firstName/lastName)

---

### 🟡 MEDIUM - communication.email
**Error**: Expected "Log entry", got "Missing"  
**Step**: `verifier/steps/communication.steps.ts` → `sendEmail`  
**Fix**:
1. Check `src/services/email/emailService.js` → verify it creates EmailLog
2. Check `src/repositories/emailRepository.js` → `createEmailLog` is called
3. Ensure log is created even if email send fails (mock OAuth token)

---

### 🟡 MEDIUM - admin.roles & admin.features
**Error**: Context keys "role" and "storeFeatures" not found  
**Root Cause**: Services not implemented or not setting context  
**Fix**:
1. Check if `src/services/admin/roleService.js` exists
2. Check if `src/services/admin/featureService.js` exists
3. If missing, create minimal implementations:
```javascript
// roleService.js
async createRole(data) {
  return await prisma.role.create({ data });
}

// featureService.js
async getStoreFeatures(storeId) {
  return await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { /* feature flags */ }
  });
}
```
4. Update steps to call services and set context

---

### 🟡 MEDIUM - reports.sales
**Error**: Generic failure at setup.sale step  
**Root Cause**: Likely same as pos.quick-sale (sale creation)  
**Fix**: Same as pos.quick-sale above

---

## Testing After Fixes

```bash
# Run all tests
npm run dpfv

# Check updated report
cat dpfv-report.json | jq '.summary'

# Run specific scenario
npm run dpfv -- --scenario=pos.quick-sale
```

## Success Criteria
- Target: 20+ PASSED (currently 11)
- Critical: pos.quick-sale must pass
- Blocker: clinical.dispense must pass to unblock pos.rx-sale

## Files You'll Modify
- `verifier/steps/*.ts` - Add context.set() calls
- `src/services/**/*.js` - Fix return values, add missing services
- `src/repositories/**/*.js` - Ensure data persistence
- `verifier/scenarios/**/*.flow.ts` - Fix test expectations if needed

## Quick Wins (Fix These First)
1. **clinical.dispense** - Change "QUEUED" → "PENDING" (1 line)
2. **Setup failures** - Add `addressLine1: "Test Address"` (5 scenarios)
3. **pos.quick-sale** - Debug sale creation error chain

Start with these 3 and you'll fix 7 failures immediately.
