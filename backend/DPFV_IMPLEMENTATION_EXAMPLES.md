# DPFV Implementation Examples
## Code Templates for Common Patterns

---

## 1. Context Auto-Propagation

### Current (Manual)
```typescript
// ❌ Repetitive and error-prone
const sale = await saleService.createSale(data);
ctx.set('sale', sale);
ctx.set('saleId', sale.id);
ctx.set('invoiceNumber', sale.invoiceNumber);
```

### Improved (Auto)
```typescript
// ✅ Automatic extraction
const sale = await saleService.createSale(data);
ctx.setAuto('sale', sale); // Auto-extracts: saleId, invoiceNumber

// Implementation in ScenarioContext.ts
setAuto(key: string, value: any) {
  this.set(key, value);
  
  // Auto-extract ID
  if (value?.id) {
    this.set(`${key}Id`, value.id);
  }
  
  // Auto-extract common fields
  const autoFields = {
    'sale': ['invoiceNumber', 'total'],
    'patient': ['firstName', 'lastName', 'phoneNumber'],
    'prescription': ['prescriptionNumber', 'status']
  };
  
  if (autoFields[key]) {
    autoFields[key].forEach(field => {
      if (value[field] !== undefined) {
        this.set(field, value[field]);
      }
    });
  }
}
```

---

## 2. Data Factory Implementation

### File: `verifier/factories/index.ts`

```typescript
import { ScenarioContext } from '../context/ScenarioContext';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const factories = {
  /**
   * Create test user with unique email
   */
  async user(ctx: ScenarioContext, overrides: any = {}) {
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-${timestamp}@test.com`,
        phoneNumber: `97${timestamp.toString().slice(-8)}`,
        passwordHash: await bcrypt.hash('Test@123', 10),
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        ...overrides
      }
    });
    
    ctx.setAuto('user', user);
    return user;
  },

  /**
   * Create test store with all required fields
   */
  async store(ctx: ScenarioContext, overrides: any = {}) {
    const timestamp = Date.now();
    const store = await prisma.store.create({
      data: {
        name: `Test Store ${timestamp}`,
        displayName: `Store ${timestamp}`,
        email: `store-${timestamp}@test.com`,
        phoneNumber: `98${timestamp.toString().slice(-8)}`,
        addressLine1: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        businessType: 'Retail Pharmacy',
        ...overrides
      }
    });
    
    ctx.setAuto('store', store);
    return store;
  },

  /**
   * Create patient with ledger
   */
  async patient(ctx: ScenarioContext, overrides: any = {}) {
    const storeId = overrides.storeId || ctx.storeId;
    const timestamp = Date.now();
    
    const patient = await prisma.patient.create({
      data: {
        storeId,
        firstName: 'Test',
        lastName: 'Patient',
        phoneNumber: `99${timestamp.toString().slice(-8)}`,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        ...overrides
      }
    });
    
    // Auto-create ledger
    await prisma.customerLedger.create({
      data: {
        storeId,
        patientId: patient.id,
        type: 'OPENING',
        amount: 0,
        balanceAfter: 0,
        notes: 'Initial ledger entry'
      }
    });
    
    ctx.setAuto('patient', patient);
    return patient;
  },

  /**
   * Create drug with batch
   */
  async drugWithBatch(ctx: ScenarioContext, overrides: any = {}) {
    const storeId = overrides.storeId || ctx.storeId;
    const timestamp = Date.now();
    
    // Create drug
    const drug = await prisma.drug.create({
      data: {
        storeId,
        name: `Test Drug ${timestamp}`,
        genericName: 'Test Generic',
        form: 'TABLET',
        strength: '500mg',
        manufacturer: 'Test Pharma',
        hsnCode: '30049099',
        gstRate: 12,
        schedule: 'UNSCHEDULED',
        ...overrides.drug
      }
    });
    
    // Create batch
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 12);
    
    const batch = await prisma.inventoryBatch.create({
      data: {
        drugId: drug.id,
        batchNumber: `BATCH-${timestamp}`,
        expiryDate,
        mrp: 100,
        purchasePrice: 80,
        quantityInStock: 1000,
        ...overrides.batch
      }
    });
    
    ctx.setAuto('drug', drug);
    ctx.setAuto('batch', batch);
    
    return { drug, batch };
  },

  /**
   * Create complete sale with items and payments
   */
  async completeSale(ctx: ScenarioContext, options: {
    itemCount?: number;
    paymentMethod?: string;
    patientId?: string;
  } = {}) {
    const { itemCount = 3, paymentMethod = 'CASH', patientId } = options;
    
    // Ensure patient exists
    const patient = patientId 
      ? await prisma.patient.findUnique({ where: { id: patientId } })
      : await this.patient(ctx);
    
    // Create drugs and batches
    const items = await Promise.all(
      Array(itemCount).fill(0).map(async () => {
        const { drug, batch } = await this.drugWithBatch(ctx);
        return {
          drugId: drug.id,
          batchId: batch.id,
          quantity: 10,
          mrp: parseFloat(batch.mrp),
          discount: 0
        };
      })
    );
    
    // Calculate total
    const total = items.reduce((sum, item) => 
      sum + (item.mrp * item.quantity * (1 - item.discount / 100)), 0
    );
    
    // Create sale via service
    const saleService = require('../../src/services/sales/saleService');
    const sale = await saleService.createQuickSale({
      storeId: ctx.storeId,
      patientId: patient.id,
      items,
      paymentSplits: [{
        method: paymentMethod,
        amount: total
      }]
    }, ctx.userId);
    
    ctx.setAuto('sale', sale);
    return sale;
  }
};
```

---

## 3. Fluent Assertion API

### File: `verifier/assertions/fluent.ts`

```typescript
export class FluentAssertion {
  constructor(private value: any, private path: string = '') {}

  toHaveProperty(prop: string) {
    if (!(prop in this.value)) {
      throw new Error(`Expected ${this.path} to have property "${prop}"`);
    }
    return new FluentAssertion(this.value[prop], `${this.path}.${prop}`);
  }

  toEqual(expected: any) {
    if (this.value !== expected) {
      throw new Error(
        `Expected ${this.path} to equal ${expected}, got ${this.value}`
      );
    }
    return this;
  }

  toMatch(pattern: RegExp) {
    if (!pattern.test(this.value)) {
      throw new Error(
        `Expected ${this.path} to match ${pattern}, got ${this.value}`
      );
    }
    return this;
  }

  greaterThan(min: number) {
    if (this.value <= min) {
      throw new Error(
        `Expected ${this.path} to be > ${min}, got ${this.value}`
      );
    }
    return this;
  }

  withLength(length: number) {
    if (!Array.isArray(this.value) || this.value.length !== length) {
      throw new Error(
        `Expected ${this.path} to have length ${length}, got ${this.value?.length}`
      );
    }
    return this;
  }

  get and() {
    return new FluentAssertion(this.value, this.path);
  }
}

export function expect(value: any) {
  return new FluentAssertion(value, 'value');
}

// Usage in tests
expect(sale)
  .toHaveProperty('invoiceNumber')
  .toMatch(/^INV-\d{4}-\d{4}$/)
  .and.toHaveProperty('total')
  .greaterThan(0);
```

---

## 4. Parallel Execution

### File: `verifier/runner/ParallelRunner.ts`

```typescript
export class ParallelRunner extends Runner {
  async run(): Promise<RunReport> {
    const startTime = new Date();
    
    // Build dependency graph
    const graph = this.buildDependencyGraph();
    
    // Execute in phases
    for (const phase of graph.phases) {
      console.log(`\n📦 Phase ${phase.number}: ${phase.scenarios.length} scenarios`);
      
      // Run all scenarios in phase concurrently
      const results = await Promise.allSettled(
        phase.scenarios.map(scenario => this.executeScenario(scenario))
      );
      
      // Store results
      results.forEach((result, index) => {
        const scenario = phase.scenarios[index];
        if (result.status === 'fulfilled') {
          this.results.set(scenario.id, result.value);
        } else {
          this.results.set(scenario.id, {
            id: scenario.id,
            status: 'FAILED',
            error: result.reason,
            steps: [],
            duration: 0
          });
        }
      });
      
      // Check if any critical scenario failed
      const criticalFailure = phase.scenarios.some(s => 
        s.tags.includes('critical') && 
        this.results.get(s.id)?.status === 'FAILED'
      );
      
      if (criticalFailure && this.config.stopOnFirstFailure) {
        console.log('🛑 Critical failure detected, stopping execution');
        break;
      }
    }
    
    const endTime = new Date();
    return this.reporter.generate(this.results, Array.from(this.scenarios.values()), startTime, endTime);
  }

  private buildDependencyGraph() {
    const phases: { number: number; scenarios: Scenario[] }[] = [];
    const processed = new Set<string>();
    let phaseNumber = 1;
    
    while (processed.size < this.scenarios.size) {
      const currentPhase: Scenario[] = [];
      
      for (const scenario of this.scenarios.values()) {
        if (processed.has(scenario.id)) continue;
        
        // Check if all dependencies are processed
        const canRun = scenario.dependsOn.every(dep => processed.has(dep));
        
        if (canRun) {
          currentPhase.push(scenario);
          processed.add(scenario.id);
        }
      }
      
      if (currentPhase.length === 0) {
        throw new Error('Circular dependency detected');
      }
      
      phases.push({ number: phaseNumber++, scenarios: currentPhase });
    }
    
    return { phases };
  }
}
```

---

## 5. Snapshot Testing

### File: `verifier/assertions/snapshot.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class SnapshotManager {
  private snapshotDir = path.join(__dirname, '../__snapshots__');
  
  constructor(private scenarioId: string) {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  toMatchSnapshot(name: string, value: any) {
    const snapshotFile = path.join(
      this.snapshotDir,
      `${this.scenarioId}.snap.json`
    );
    
    // Normalize dynamic values
    const normalized = this.normalize(value);
    
    // Load existing snapshots
    let snapshots: any = {};
    if (fs.existsSync(snapshotFile)) {
      snapshots = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
    }
    
    // Update mode (CI=false)
    if (process.env.CI !== 'true') {
      snapshots[name] = normalized;
      fs.writeFileSync(snapshotFile, JSON.stringify(snapshots, null, 2));
      return true;
    }
    
    // Compare mode (CI=true)
    const expected = snapshots[name];
    if (!expected) {
      throw new Error(`Snapshot "${name}" not found. Run locally to create.`);
    }
    
    if (JSON.stringify(normalized) !== JSON.stringify(expected)) {
      throw new Error(
        `Snapshot mismatch for "${name}":\n` +
        `Expected: ${JSON.stringify(expected, null, 2)}\n` +
        `Actual: ${JSON.stringify(normalized, null, 2)}`
      );
    }
    
    return true;
  }

  private normalize(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(v => this.normalize(v));
    }
    
    const normalized: any = {};
    for (const [key, val] of Object.entries(value)) {
      // Replace dynamic values
      if (key === 'id' || key.endsWith('Id')) {
        normalized[key] = '<DYNAMIC>';
      } else if (key.includes('createdAt') || key.includes('updatedAt')) {
        normalized[key] = '<TIMESTAMP>';
      } else if (key === 'email' && typeof val === 'string' && val.includes('@test.com')) {
        normalized[key] = '<TEST_EMAIL>';
      } else {
        normalized[key] = this.normalize(val);
      }
    }
    
    return normalized;
  }
}

// Usage
const snapshot = new SnapshotManager('pos.quick-sale');
snapshot.toMatchSnapshot('sale-structure', sale);
```

---

## 6. Performance Tracking

### File: `verifier/assertions/performance.ts`

```typescript
export class PerformanceTracker {
  private metrics: Map<string, any> = new Map();

  async track<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Track query count
    let queryCount = 0;
    const queryInterceptor = prisma.$use(async (params, next) => {
      queryCount++;
      return next(params);
    });
    
    try {
      const result = await fn();
      
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;
      
      this.metrics.set(name, {
        duration,
        memoryUsed,
        queryCount,
        timestamp: new Date()
      });
      
      return result;
    } finally {
      // Remove interceptor
    }
  }

  assert(name: string, expectations: {
    maxDuration?: number;
    maxQueries?: number;
    maxMemory?: number;
  }) {
    const metrics = this.metrics.get(name);
    if (!metrics) {
      throw new Error(`No metrics found for "${name}"`);
    }
    
    if (expectations.maxDuration && metrics.duration > expectations.maxDuration) {
      throw new Error(
        `Performance violation: ${name} took ${metrics.duration}ms, ` +
        `expected < ${expectations.maxDuration}ms`
      );
    }
    
    if (expectations.maxQueries && metrics.queryCount > expectations.maxQueries) {
      throw new Error(
        `Performance violation: ${name} executed ${metrics.queryCount} queries, ` +
        `expected < ${expectations.maxQueries}`
      );
    }
    
    if (expectations.maxMemory && metrics.memoryUsed > expectations.maxMemory) {
      throw new Error(
        `Performance violation: ${name} used ${metrics.memoryUsed} bytes, ` +
        `expected < ${expectations.maxMemory} bytes`
      );
    }
  }

  generateReport() {
    const report: any = {};
    for (const [name, metrics] of this.metrics.entries()) {
      report[name] = {
        avgDuration: metrics.duration,
        queryCount: metrics.queryCount,
        memoryUsed: `${(metrics.memoryUsed / 1024 / 1024).toFixed(2)}MB`
      };
    }
    return report;
  }
}

// Usage
const perf = new PerformanceTracker();

await perf.track('create-sale', async () => {
  return await saleService.createSale(data);
});

perf.assert('create-sale', {
  maxDuration: 500,
  maxQueries: 10,
  maxMemory: 50 * 1024 * 1024
});
```

---

## 7. Scenario Template

### File: `verifier/scenarios/_template.flow.ts`

```typescript
/**
 * [Feature Name] Flow Scenario
 * Description: What this scenario validates
 */

import { Scenario } from '../../types';
import { factories } from '../../factories';
import { expect } from '../../assertions/fluent';

export const templateScenario: Scenario = {
  id: 'domain.feature',
  name: 'Feature Name Flow',
  description: 'Validates [specific behavior]',
  dependsOn: ['core.auth', 'core.onboarding'], // Prerequisites
  validatesFeatures: ['feature1', 'feature2'],
  tags: ['critical'], // critical, smoke, regression
  modes: ['dev', 'staging', 'ci'],

  steps: [
    {
      id: 'feature.setup',
      name: 'Setup test data',
      execute: async (ctx) => {
        // Use factories for data creation
        const patient = await factories.patient(ctx);
        const { drug, batch } = await factories.drugWithBatch(ctx);
        
        return {
          success: true,
          data: { patient, drug, batch },
          duration: 0
        };
      },
      assertions: [
        {
          name: 'Patient created',
          invariant: 'DATA-001',
          check: async (ctx) => {
            const patient = ctx.get('patient');
            return {
              passed: Boolean(patient?.id),
              expected: 'Patient with ID',
              actual: patient?.id || 'None',
              message: 'Patient must be created'
            };
          }
        }
      ],
      critical: true,
      timeout: 10000
    },

    {
      id: 'feature.action',
      name: 'Perform main action',
      execute: async (ctx) => {
        // Main test logic
        const result = await someService.doSomething(ctx.get('patient').id);
        
        // Use fluent assertions
        expect(result)
          .toHaveProperty('id')
          .and.toHaveProperty('status')
          .toEqual('SUCCESS');
        
        ctx.setAuto('result', result);
        
        return {
          success: true,
          data: result,
          duration: 0
        };
      },
      assertions: [
        {
          name: 'Action completed',
          invariant: 'FEATURE-001',
          check: async (ctx) => {
            const result = ctx.get('result');
            return {
              passed: result.status === 'SUCCESS',
              expected: 'SUCCESS',
              actual: result.status,
              message: 'Action must complete successfully'
            };
          }
        }
      ],
      critical: true,
      timeout: 5000
    },

    {
      id: 'feature.verify',
      name: 'Verify side effects',
      execute: async (ctx) => {
        // Verify database state
        const record = await prisma.someModel.findUnique({
          where: { id: ctx.get('resultId') }
        });
        
        return {
          success: true,
          data: record,
          duration: 0
        };
      },
      assertions: [
        {
          name: 'Database updated',
          invariant: 'DATA-002',
          check: async (ctx) => {
            const record = ctx.get('record');
            return {
              passed: Boolean(record),
              expected: 'Record exists',
              actual: record ? 'Found' : 'Not found',
              message: 'Database must be updated'
            };
          }
        }
      ],
      critical: false,
      timeout: 5000
    }
  ]
};
```

---

## Quick Reference

### Running Tests
```bash
# All tests
npm run dpfv

# Specific scenario
npm run dpfv -- --scenario=pos.quick-sale

# By tag
npm run dpfv -- --tags=critical

# Parallel mode
npm run dpfv -- --parallel

# With performance tracking
npm run dpfv -- --perf
```

### Adding New Scenario
1. Copy `_template.flow.ts`
2. Update metadata (id, name, dependencies)
3. Implement steps using factories
4. Add fluent assertions
5. Register in `run.ts`
6. Run: `npm run dpfv -- --scenario=your.new.scenario`

### Debugging Failed Test
1. Check `dpfv-report.json` for error details
2. Run specific scenario: `npm run dpfv -- --scenario=failing.test`
3. Add console.log in step execute function
4. Check service implementation
5. Verify database state with Prisma Studio

---

**Pro Tip**: Start with the template, use factories for data, and leverage fluent assertions for readability!
