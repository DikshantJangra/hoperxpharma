# DPFV System Design & Expansion Blueprint
## Deterministic Product Flow Verifier - Complete Architecture

---

## 🎯 Executive Summary

**Current State**: 11/24 tests passing (46%)  
**Target State**: 100+ comprehensive tests covering all critical flows  
**Vision**: DPFV as the single source of truth for platform integrity

---

## 📊 Gap Analysis: What's Missing

### 1. **Coverage Gaps by Domain**

#### ✅ **Currently Covered** (11 scenarios)
- Core Auth (signup, login, token refresh)
- Onboarding (store setup)
- Patient CRUD
- Prescription lifecycle
- Procurement (PO → GRN → Stock)
- Subscription management
- Access logging
- Admin PIN
- Supplier management
- WhatsApp messaging

#### ❌ **Missing Critical Flows** (35+ scenarios needed)

##### **A. Financial & Accounting** (8 scenarios)
1. **Multi-payment splits** - Cash + Card + UPI in single sale
2. **Credit limit enforcement** - Block sale if patient exceeds limit
3. **Payment reconciliation** - Match bank deposits to sales
4. **Discount authorization** - Require PIN for >10% discount
5. **Day-end closing** - Cash drawer reconciliation
6. **Expense tracking** - Petty cash, utilities, salaries
7. **Profit margin calculation** - Per-item and per-sale margins
8. **Tax filing preparation** - GSTR-1, GSTR-3B data aggregation

##### **B. Inventory Intelligence** (7 scenarios)
1. **FIFO/FEFO enforcement** - Verify oldest batch sold first
2. **Batch expiry cascade** - Auto-adjust when batch expires
3. **Negative stock prevention** - Hard block on overselling
4. **Stock transfer** - Between stores (multi-store chains)
5. **Wastage tracking** - Expired/damaged goods accounting
6. **Reorder point automation** - Auto-generate PO when stock low
7. **ABC analysis** - Fast/slow-moving drug classification

##### **C. Clinical Safety** (6 scenarios)
1. **Drug interaction checking** - Alert on dangerous combinations
2. **Allergy verification** - Block if patient allergic
3. **Dosage validation** - Age/weight-based limits
4. **Controlled substance tracking** - Schedule H/X compliance
5. **Prescription expiry enforcement** - Block refill after expiry
6. **Duplicate therapy detection** - Same drug from multiple Rx

##### **D. Compliance & Audit** (5 scenarios)
1. **CDSCO audit trail** - Complete chain of custody
2. **Data retention policy** - Auto-archive after 7 years
3. **User activity forensics** - Who changed what when
4. **Regulatory reporting** - Monthly drug sales to authorities
5. **Privacy breach detection** - Unauthorized data access alerts

##### **E. Multi-Store Operations** (4 scenarios)
1. **Centralized inventory** - View stock across all stores
2. **Inter-store transfers** - Request/approve/ship workflow
3. **Consolidated reporting** - Chain-wide sales analytics
4. **Role inheritance** - Permissions across store hierarchy

##### **F. Customer Experience** (5 scenarios)
1. **Loyalty points** - Earn on purchase, redeem on next
2. **Refill reminders** - SMS/Email 3 days before Rx expires
3. **Medicine finder** - Search availability across stores
4. **Home delivery** - Order → Pack → Ship → Deliver
5. **Feedback loop** - Rating → Review → Response

---

## 🏗️ Architecture Enhancements

### **1. Context Propagation System**

**Problem**: Currently, context is manually passed step-by-step  
**Solution**: Implement smart context inheritance

```typescript
// NEW: Context Layers
class ScenarioContext {
  // Layer 1: Global (persists across all scenarios)
  global: {
    userId: string;
    storeId: string;
    authToken: string;
  }
  
  // Layer 2: Scenario-scoped (cleared after scenario)
  scenario: Map<string, any>;
  
  // Layer 3: Step-scoped (cleared after step)
  step: Map<string, any>;
  
  // Auto-propagation rules
  propagationRules: {
    'sale' → 'saleId',           // Extract ID automatically
    'patient' → 'patientId',
    'prescription' → 'prescriptionId'
  }
}
```

**Benefits**:
- No manual `ctx.set()` calls
- Auto-extract IDs from objects
- Clear separation of concerns

---

### **2. Assertion Framework Upgrade**

**Current**: Basic pass/fail checks  
**Needed**: Rich assertion library

```typescript
// NEW: Fluent Assertion API
expect(sale)
  .toHaveProperty('invoiceNumber')
  .matching(/^INV-\d{4}-\d{4}$/)
  .and.toHaveProperty('total')
  .greaterThan(0)
  .and.toHaveProperty('items')
  .withLength.greaterThan(0)
  .and.each.toHaveProperty('drugId')
  .and.toHaveProperty('paymentSplits')
  .withSum('amount').equalTo(sale.total);

// Database state assertions
expectDatabase('Sale')
  .where({ id: saleId })
  .toExist()
  .and.toHaveRelation('items')
  .withCount(3)
  .and.toHaveRelation('paymentSplits')
  .withSum('amount').equalTo(sale.total);

// Time-based assertions
expectEventually(() => emailLog.status)
  .toEqual('SENT')
  .within(5000); // 5 seconds
```

---

### **3. Data Factory System**

**Problem**: Repetitive test data creation  
**Solution**: Smart factories with relationships

```typescript
// NEW: Factory Pattern
const factories = {
  user: (overrides?) => ({
    email: `test-${Date.now()}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN',
    ...overrides
  }),
  
  store: (overrides?) => ({
    name: `Store ${Date.now()}`,
    addressLine1: '123 Test St',
    city: 'Mumbai',
    state: 'Maharashtra',
    ...overrides
  }),
  
  // Relationship-aware
  saleWithItems: async (ctx, itemCount = 3) => {
    const patient = await factories.patient(ctx);
    const drugs = await Promise.all(
      Array(itemCount).fill(0).map(() => factories.drug(ctx))
    );
    const batches = await Promise.all(
      drugs.map(d => factories.batch(ctx, { drugId: d.id }))
    );
    return factories.sale(ctx, {
      patientId: patient.id,
      items: batches.map(b => ({
        drugId: b.drugId,
        batchId: b.id,
        quantity: 10
      }))
    });
  }
};
```

---

### **4. Parallel Execution Engine**

**Current**: Sequential execution (slow)  
**Needed**: Parallel execution with dependency graph

```typescript
// NEW: Parallel Runner
const executionPlan = {
  // Phase 1: Independent scenarios (parallel)
  phase1: [
    'core.auth',
    'patients.create',
    'inventory.drug-catalog'
  ],
  
  // Phase 2: Depends on Phase 1 (parallel within phase)
  phase2: [
    'pos.quick-sale',      // depends: auth, inventory
    'clinical.prescription' // depends: auth, patients
  ],
  
  // Phase 3: Integration tests (parallel)
  phase3: [
    'pos.rx-sale',         // depends: prescription, inventory
    'reports.sales'        // depends: quick-sale
  ]
};

// Execution time: 80s → 25s (3x faster)
```

---

### **5. Snapshot Testing**

**Use Case**: Verify complex object structures don't change unexpectedly

```typescript
// NEW: Snapshot Assertions
expectSnapshot(sale)
  .toMatchSnapshot('sale-with-gst-invoice');

// Generates: __snapshots__/pos.quick-sale.snap
{
  "sale-with-gst-invoice": {
    "invoiceNumber": "<DYNAMIC>",
    "total": 224.00,
    "taxAmount": 24.00,
    "items": [
      {
        "drugId": "<DYNAMIC>",
        "quantity": 10,
        "mrp": 25.00
      }
    ]
  }
}
```

---

### **6. Performance Benchmarking**

**Track**: Response times, database query counts, memory usage

```typescript
// NEW: Performance Assertions
expectPerformance(step)
  .toCompleteWithin(500) // ms
  .and.toExecuteQueries.lessThan(10)
  .and.toUseMemory.lessThan(50 * 1024 * 1024); // 50MB

// Report: dpfv-performance.json
{
  "pos.quick-sale": {
    "avgDuration": 450,
    "p95Duration": 680,
    "queryCount": 8,
    "memoryPeak": 42MB
  }
}
```

---

### **7. Chaos Engineering**

**Test**: System behavior under failure conditions

```typescript
// NEW: Chaos Scenarios
const chaosScenarios = [
  {
    id: 'pos.sale-with-db-timeout',
    inject: () => {
      // Simulate slow database
      prisma.$use(async (params, next) => {
        await sleep(5000);
        return next(params);
      });
    },
    expect: 'Transaction should timeout gracefully'
  },
  
  {
    id: 'pos.sale-with-network-failure',
    inject: () => {
      // Simulate payment gateway down
      mockPaymentGateway.reject();
    },
    expect: 'Sale should be marked PENDING_PAYMENT'
  }
];
```

---

## 🔄 Workflow Verification Patterns

### **Pattern 1: State Machine Validation**

```typescript
// Verify state transitions are valid
const validTransitions = {
  'Prescription': {
    'DRAFT': ['ACTIVE', 'CANCELLED'],
    'ACTIVE': ['COMPLETED', 'EXPIRED', 'CANCELLED'],
    'COMPLETED': [],
    'EXPIRED': [],
    'CANCELLED': []
  }
};

expectStateTransition('Prescription', prescriptionId)
  .from('DRAFT')
  .to('ACTIVE')
  .toBeValid();

expectStateTransition('Prescription', prescriptionId)
  .from('COMPLETED')
  .to('DRAFT')
  .toBeInvalid(); // Should throw error
```

---

### **Pattern 2: Idempotency Testing**

```typescript
// Verify operations can be safely retried
const saleData = { /* ... */ };

const sale1 = await createSale(saleData);
const sale2 = await createSale(saleData); // Retry

expect(sale1.id).toEqual(sale2.id); // Same sale
expect(sale1.invoiceNumber).toEqual(sale2.invoiceNumber);

// Verify no duplicate stock deduction
expectInventory(batchId)
  .toHaveQuantity(initialStock - soldQuantity);
```

---

### **Pattern 3: Eventual Consistency**

```typescript
// Verify async operations complete
await createSale(saleData);

// Email should be sent within 5 seconds
await expectEventually(() => 
  emailLog.where({ saleId }).first()
).toExist().within(5000);

// Loyalty points should be credited within 10 seconds
await expectEventually(() =>
  patient.loyaltyPoints
).toEqual(initialPoints + earnedPoints).within(10000);
```

---

## 📈 Metrics & Observability

### **1. Test Coverage Dashboard**

```json
{
  "coverage": {
    "byDomain": {
      "auth": { "scenarios": 4, "coverage": 95% },
      "pos": { "scenarios": 8, "coverage": 60% },
      "inventory": { "scenarios": 12, "coverage": 75% },
      "clinical": { "scenarios": 6, "coverage": 50% }
    },
    "byFeature": {
      "sale-creation": { "paths": 8, "covered": 6 },
      "payment-processing": { "paths": 12, "covered": 8 }
    },
    "byRisk": {
      "critical": { "total": 25, "covered": 20 },
      "high": { "total": 40, "covered": 28 },
      "medium": { "total": 60, "covered": 35 }
    }
  }
}
```

---

### **2. Regression Detection**

```typescript
// Track test stability over time
{
  "pos.quick-sale": {
    "lastPassed": "2026-01-07T12:00:00Z",
    "failureRate": 0.02, // 2% flaky
    "avgDuration": 450,
    "trend": "stable"
  },
  "clinical.dispense": {
    "lastPassed": "2026-01-05T10:00:00Z",
    "failureRate": 0.15, // 15% flaky - INVESTIGATE
    "avgDuration": 1200,
    "trend": "degrading"
  }
}
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation (Week 1-2)**
- [ ] Fix all 12 failing tests
- [ ] Implement context auto-propagation
- [ ] Add data factories for common entities
- [ ] Set up parallel execution

### **Phase 2: Coverage Expansion (Week 3-4)**
- [ ] Add 20 financial flow scenarios
- [ ] Add 15 inventory intelligence scenarios
- [ ] Add 10 clinical safety scenarios
- [ ] Add 8 compliance scenarios

### **Phase 3: Advanced Features (Week 5-6)**
- [ ] Implement fluent assertion API
- [ ] Add snapshot testing
- [ ] Add performance benchmarking
- [ ] Add chaos engineering scenarios

### **Phase 4: Production Readiness (Week 7-8)**
- [ ] CI/CD integration
- [ ] Nightly regression suite
- [ ] Coverage dashboard
- [ ] Alert system for failures

---

## 🎓 Best Practices

### **1. Test Naming Convention**
```
domain.feature.variant
├── pos.sale.quick-walk-in
├── pos.sale.with-prescription
├── pos.sale.credit-payment
├── pos.sale.multi-payment-split
└── pos.sale.with-discount-approval
```

### **2. Assertion Granularity**
```typescript
// ❌ BAD: Single assertion
expect(sale).toBeDefined();

// ✅ GOOD: Multiple specific assertions
expect(sale.id).toBeDefined();
expect(sale.invoiceNumber).toMatch(/^INV-/);
expect(sale.total).toBeGreaterThan(0);
expect(sale.items).toHaveLength.greaterThan(0);
expect(sale.paymentSplits).toHaveLength.greaterThan(0);
```

### **3. Test Data Isolation**
```typescript
// Each test gets fresh data
beforeEach(async () => {
  ctx.testUser = await factories.user();
  ctx.testStore = await factories.store({ ownerId: ctx.testUser.id });
  ctx.testPatient = await factories.patient({ storeId: ctx.testStore.id });
});

afterEach(async () => {
  await cleanup.deleteTestData(ctx);
});
```

---

## 🔐 Security Testing

### **Scenarios to Add**
1. **SQL Injection** - Verify Prisma prevents injection
2. **XSS Prevention** - Verify input sanitization
3. **CSRF Protection** - Verify token validation
4. **Rate Limiting** - Verify brute force protection
5. **JWT Tampering** - Verify signature validation
6. **Permission Bypass** - Verify RBAC enforcement
7. **Data Leakage** - Verify no sensitive data in logs

---

## 📊 Success Metrics

### **Quantitative**
- Test coverage: 95%+ of critical paths
- Test execution time: <5 minutes for full suite
- Flakiness rate: <1%
- Mean time to detect regression: <1 hour

### **Qualitative**
- Developers trust DPFV as pre-deployment gate
- Product team uses DPFV for feature validation
- Support team uses DPFV for bug reproduction
- DPFV catches 90%+ of bugs before production

---

## 🎯 Next Steps for Implementation Agent

1. **Read this document thoroughly**
2. **Fix current 12 failures** (use DPFV_FIX_PROMPT.md)
3. **Implement context auto-propagation** (biggest efficiency gain)
4. **Add data factories** (reduce boilerplate)
5. **Pick 5 high-priority missing scenarios** (from Gap Analysis)
6. **Implement fluent assertions** (better readability)
7. **Set up parallel execution** (3x speed improvement)
8. **Document patterns** (for future scenario authors)

---

**Remember**: DPFV is not just a test suite—it's the **living specification** of how HopeRxPharma works. Every scenario is a contract. Every assertion is a guarantee. Build it with that mindset.
