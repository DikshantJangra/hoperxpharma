# Inventory Auto-Update Flow Documentation

## ✅ Confirmed: Backend Automatically Updates Inventory & Batches

### Complete Flow

#### 1. Purchase Order Creation
- **Route**: `POST /api/v1/purchase-orders`
- **Status**: `DRAFT`
- **Location**: Shows in `/orders/pending`

#### 2. Send Purchase Order
- **Route**: `PUT /api/v1/purchase-orders/:id/send`
- **Status**: `SENT`
- **Location**: Stays in `/orders/pending`

#### 3. Receive Shipment (GRN Process)
- **Route**: `POST /api/v1/grn` (Initialize GRN from PO)
- **Frontend**: `/orders/pending/[id]/receive`
- **User Actions**:
  - Fill batch numbers
  - Fill expiry dates
  - Fill MRP
  - Adjust received quantities
  - Add invoice details

#### 4. Complete GRN (Auto-Updates Inventory)
- **Route**: `POST /api/v1/grn/:id/complete`
- **Backend Automatically**:
  1. ✅ Creates `InventoryBatch` records for each item
  2. ✅ Creates `StockMovement` records (type: 'IN')
  3. ✅ Updates `PurchaseOrderItem.receivedQty`
  4. ✅ Updates `PurchaseOrder.status` to:
     - `RECEIVED` (if all items received)
     - `PARTIALLY_RECEIVED` (if some items pending)

### Backend Code Reference

**File**: `/backend/src/repositories/grnRepository.js`

**Function**: `completeGRN(grnId, userId)`

```javascript
// 1. Create inventory batches
await tx.inventoryBatch.create({
    data: {
        storeId: grn.storeId,
        drugId: item.drugId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantityInStock: totalQty,
        mrp: item.mrp,
        purchasePrice: item.unitPrice,
        supplierId: grn.supplierId
    }
});

// 2. Create stock movement
await tx.stockMovement.create({
    data: {
        batchId: batch.id,
        movementType: 'IN',
        quantity: totalQty,
        reason: `GRN ${grn.grnNumber}`,
        referenceType: 'grn',
        referenceId: grn.id,
        userId
    }
});

// 3. Update PO item received quantities
await tx.purchaseOrderItem.update({
    where: { id: grnItem.poItemId },
    data: {
        receivedQty: { increment: totalReceived }
    }
});

// 4. Update PO status
await tx.purchaseOrder.update({
    where: { id: grn.poId },
    data: { status: newPOStatus }
});
```

---

## 🔧 Frontend Fix: Auto-Refresh Inventory & Batches

### Problem
The inventory and batches pages were **not auto-refreshing** after new data was added via GRN completion.

### Solution Implemented

#### 1. Batches Page (`/inventory/batches`)
**Changes**:
- ✅ Added auto-refresh every 30 seconds
- ✅ Added manual "Refresh" button
- ✅ Refactored `fetchBatches` to be reusable

**Code**:
```typescript
// Auto-refresh every 30 seconds
useEffect(() => {
    const interval = setInterval(fetchBatches, 30000);
    return () => clearInterval(interval);
}, [searchQuery]);

// Manual refresh button
<button onClick={fetchBatches} disabled={isLoading}>
    {isLoading ? 'Refreshing...' : 'Refresh'}
</button>
```

#### 2. Inventory Page (`/inventory`)
**Changes**:
- ✅ Converted from static to dynamic page
- ✅ Added drug listing with search
- ✅ Added auto-refresh every 30 seconds
- ✅ Added manual refresh button

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│   Create PO     │
│  (Status: DRAFT)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Send PO      │
│  (Status: SENT) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Receive Shipment (GRN)          │
│  - Fill batch details               │
│  - Fill expiry dates                │
│  - Adjust quantities                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Complete GRN                   │
│  Backend Auto-Updates:              │
│  ✅ InventoryBatch                  │
│  ✅ StockMovement                   │
│  ✅ PurchaseOrderItem.receivedQty   │
│  ✅ PurchaseOrder.status            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Inventory & Batches Updated       │
│   (Auto-refresh every 30s)          │
└─────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

1. **Backend is Already Perfect**: The GRN completion automatically updates inventory and batches in a single transaction.

2. **Frontend Needed Auto-Refresh**: The pages were only fetching on initial load, not when new data was added.

3. **Solution**: Added 30-second polling + manual refresh buttons.

4. **Alternative Solutions** (for future):
   - WebSocket for real-time updates
   - Server-Sent Events (SSE)
   - React Query with cache invalidation

---

## 🧪 Testing the Flow

### Test Steps:
1. Create a new PO at `/orders/new-po`
2. Send the PO (status → `SENT`)
3. Go to `/orders/pending` and click "Receive"
4. Fill in batch details, expiry, MRP
5. Click "Complete Receiving"
6. Navigate to `/inventory/batches`
7. **Verify**: New batches appear (within 30s or click Refresh)
8. Navigate to `/inventory`
9. **Verify**: Drug inventory is updated

---

## 📝 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/purchase-orders` | POST | Create PO |
| `/api/v1/purchase-orders/:id/send` | PUT | Send PO to supplier |
| `/api/v1/grn` | POST | Initialize GRN from PO |
| `/api/v1/grn/:id/complete` | POST | Complete GRN & update inventory |
| `/api/v1/inventory/batches` | GET | Fetch batches |
| `/api/v1/inventory/drugs` | GET | Fetch drugs |

---

## ✨ Conclusion

**Your backend was already handling everything correctly!** The only issue was the frontend not refreshing to show the new data. This has now been fixed with auto-refresh functionality.

The complete flow from PO creation → GRN completion → Inventory update is now fully functional and visible in the UI.
