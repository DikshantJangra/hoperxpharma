# Multi-Subscription Backend Architecture

> **Status**: Documentation Only - For Future Implementation  
> **Created**: January 2026  
> **Purpose**: Blueprint for multi-subscription capability when ready to implement

---

## Overview

This document outlines the proposed backend data model changes to support **multi-subscription per account** (capability-based pricing). The current system uses a 1:1 Store→Subscription relationship. The new model introduces **Business Units** that can each have independent subscriptions.

---

## Current vs Proposed Model

### Current Model (Plan-Based)

```
Store (Account)
  └── Subscription (1:1)
        └── SubscriptionPlan (Free, Pro, Enterprise)
```

**Limitations:**
- Only one subscription per store
- Plan upgrades replace entire subscription
- No multi-vertical support (Retail + Wholesale together)

---

### Proposed Model (Capability-Based)

```
Account (Store)
  ├── BusinessUnit (RETAIL)
  │     └── ModuleSubscription (active)
  ├── BusinessUnit (WHOLESALE)
  │     └── ModuleSubscription (inactive → active)
  ├── BusinessUnit (HOSPITAL)
  │     └── ModuleSubscription (coming_soon)
  └── BusinessUnit (MULTICHAIN)
        └── ModuleSubscription (coming_soon)
        └── StoreAssignments[] (for per-store billing)
```

**Benefits:**
- Multiple independent subscriptions per account
- Stacking modules with add-on pricing
- Future-proof for new verticals
- Clean billing separation

---

## Proposed Schema Changes

### New Enum: BusinessUnitType

```prisma
enum BusinessUnitType {
  RETAIL
  WHOLESALE
  HOSPITAL
  MULTICHAIN
}
```

### New Enum: ModuleSubscriptionStatus

```prisma
enum ModuleSubscriptionStatus {
  INACTIVE      // Not purchased, not visible
  COMING_SOON   // UI visible but cannot purchase
  TRIAL         // Demo/trial period active
  ACTIVE        // Paid and active
  GRACE         // Payment overdue, grace period
  LOCKED        // Access blocked due to payment failure
  CANCELLED     // User cancelled, access until period end
  EXPIRED       // Subscription period ended
}
```

### New Model: BusinessUnit

```prisma
model BusinessUnit {
  id        String           @id @default(cuid())
  storeId   String           // The parent account
  type      BusinessUnitType @unique // Only one of each type per store
  
  // Capabilities enabled for this business unit
  capabilities Json?  // { "bulkInvoicing": true, "wardManagement": false }
  
  // Relations
  store        Store                @relation(fields: [storeId], references: [id], onDelete: Cascade)
  subscription ModuleSubscription?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([storeId, type])
  @@index([storeId])
}
```

### New Model: ModuleSubscription

```prisma
model ModuleSubscription {
  id             String                   @id @default(cuid())
  businessUnitId String                   @unique
  status         ModuleSubscriptionStatus @default(INACTIVE)
  
  // Pricing (at time of subscription)
  priceMonthly   Decimal @db.Decimal(10, 2)
  billingCycle   String  // "monthly" | "yearly"
  isAddon        Boolean @default(false)  // Was this purchased as add-on to Retail?
  
  // Period tracking
  trialEndsAt        DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  autoRenew          Boolean   @default(true)
  
  // Grace period handling
  gracePeriodEndsAt  DateTime?
  
  // Relations
  businessUnit BusinessUnit @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  payments     ModulePayment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([status])
  @@index([currentPeriodEnd])
}
```

### New Model: ModulePayment

```prisma
model ModulePayment {
  id                   String   @id @default(cuid())
  moduleSubscriptionId String
  amount               Decimal  @db.Decimal(10, 2)
  currency             String   @default("INR")
  status               String   // PENDING, COMPLETED, FAILED, REFUNDED
  
  // For GST compliance - line item breakdown
  lineItems            Json?    // [{ module: "RETAIL", amount: 799 }, { module: "WHOLESALE", amount: 999 }]
  
  // Razorpay
  razorpayOrderId      String   @unique
  razorpayPaymentId    String?  @unique
  razorpaySignature    String?
  
  subscription ModuleSubscription @relation(fields: [moduleSubscriptionId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([moduleSubscriptionId])
}
```

### Enhanced Model: Store (Additions)

```prisma
model Store {
  // ... existing fields ...
  
  // NEW: Business Units
  businessUnits BusinessUnit[]
  
  // NEW: Multi-chain support
  isHeadquarters Boolean @default(false)
  headquartersId String?  // For child stores in a chain
  
  headquarters   Store?  @relation("StoreChain", fields: [headquartersId], references: [id])
  childStores    Store[] @relation("StoreChain")
}
```

---

## Subscription State Machine

```
                    ┌─────────────┐
                    │ COMING_SOON │ (System-controlled)
                    └──────┬──────┘
                           │ Feature launches
                           ▼
┌──────────┐         ┌─────────────┐
│ INACTIVE │◄───────►│    TRIAL    │
└────┬─────┘         └──────┬──────┘
     │ Purchase              │ Trial ends + payment
     │                       │
     ▼                       ▼
┌──────────┐         ┌─────────────┐
│  ACTIVE  │◄───────►│    GRACE    │
└────┬─────┘         └──────┬──────┘
     │ Cancel                │ Payment fails
     │                       │
     ▼                       ▼
┌──────────┐         ┌─────────────┐
│CANCELLED │         │   LOCKED    │
└────┬─────┘         └──────┬──────┘
     │ Period ends           │ Payment fails permanently
     ▼                       ▼
┌──────────┐         ┌─────────────┐
│ EXPIRED  │         │   EXPIRED   │
└──────────┘         └─────────────┘
```

---

## Feature Access Logic

Replace plan-based feature checks with capability-based checks:

### Current (Plan-Based)
```javascript
// ❌ Old approach
if (subscription.plan.name === 'Pro') {
  enableFeature('whatsapp');
}
```

### Proposed (Capability-Based)
```javascript
// ✅ New approach
async function hasCapability(storeId, capability) {
  const businessUnits = await getActiveBusinessUnits(storeId);
  
  for (const unit of businessUnits) {
    if (unit.subscription?.status === 'ACTIVE' || unit.subscription?.status === 'TRIAL') {
      const capabilities = unit.capabilities || getDefaultCapabilities(unit.type);
      if (capabilities[capability]) return true;
    }
  }
  
  return false;
}

// Usage
if (await hasCapability(storeId, 'WHOLESALE_INVOICING')) {
  // Enable wholesale features
}
```

---

## Sidebar Visibility Logic

```javascript
// Proposed sidebar section visibility
function getSidebarSections(store, businessUnits) {
  const sections = [];
  
  // Always show base sections
  sections.push('Dashboard', 'Settings');
  
  // Add sections based on active business units
  for (const unit of businessUnits) {
    const isActive = ['ACTIVE', 'TRIAL'].includes(unit.subscription?.status);
    const isComingSoon = unit.subscription?.status === 'COMING_SOON';
    
    sections.push({
      id: unit.type,
      name: getUnitName(unit.type),
      enabled: isActive,
      locked: isComingSoon,
      visible: true, // Always show to tease upgrades
    });
  }
  
  return sections;
}
```

---

## Migration Strategy

When ready to implement:

### Phase 1: Schema Migration
1. Add new tables (non-breaking)
2. Run data migration to create BusinessUnit records for existing stores
3. Map existing Subscription to ModuleSubscription (RETAIL type)

### Phase 2: Code Migration
1. Update subscription service to use new models
2. Update feature access checks
3. Update billing/payment flows

### Phase 3: UI Activation
1. Remove "Coming Soon" badges
2. Enable purchase flows for new modules
3. Update sidebar to show all active modules

---

## GST Billing Considerations

For Indian compliance, each module should be line-itemed:

```
╔═══════════════════════════════════════════════════╗
║  HopeRx Invoice                                   ║
╠═══════════════════════════════════════════════════╣
║  HopeRx Retail License (Annual)    ₹7,999.00     ║
║  HopeRx Wholesale License          ₹  999.00     ║
║  ─────────────────────────────────────────────── ║
║  Subtotal                          ₹8,998.00     ║
║  CGST @9%                          ₹  809.82     ║
║  SGST @9%                          ₹  809.82     ║
║  ─────────────────────────────────────────────── ║
║  Total                             ₹10,617.64    ║
╚═══════════════════════════════════════════════════╝
```

---

## API Endpoints (Proposed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/modules` | Get all business units with subscription status |
| POST | `/api/subscriptions/modules/:type/subscribe` | Subscribe to a module |
| POST | `/api/subscriptions/modules/:type/cancel` | Cancel module subscription |
| GET | `/api/subscriptions/combos` | Get available combo bundles |
| POST | `/api/subscriptions/combos/:id/subscribe` | Subscribe to a combo |

---

## Testing Checklist (Future)

- [ ] Create BusinessUnit for existing stores during migration
- [ ] Verify Retail subscription maps correctly
- [ ] Test adding Wholesale as add-on
- [ ] Test combo bundle purchase
- [ ] Verify GST invoice shows line items
- [ ] Test grace period → locked transition
- [ ] Test capability access across modules
- [ ] Verify sidebar sections update correctly

---

## Notes

1. **Current `Subscription` table**: Keep for backward compatibility during transition
2. **`BusinessTypeConfig` table**: Already exists and defines feature visibility - can be extended
3. **Razorpay**: Supports subscription plans natively, but we may need custom invoicing for combos
4. **Per-store billing for Multichain**: Use a separate `MultichainStoreAssignment` table
