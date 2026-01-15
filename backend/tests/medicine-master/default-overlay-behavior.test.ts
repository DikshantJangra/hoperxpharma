/**
 * Property Test: Default Overlay Behavior (Property 9)
 * 
 * Validates: Requirements 2.5
 * 
 * Property: When no overlay exists, merged view should show master data with null overlay fields
 * 
 * Test Strategy:
 * - Create medicine without overlay
 * - Get merged view
 * - Verify master fields present
 * - Verify overlay fields are undefined/null
 * - Verify computed fields use defaults
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { storeOverlayService } from '../../src/services/StoreOverlayService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 9: Default Overlay Behavior', () => {
  let testMedicineId: string;
  const testStoreId = 'test-store-default';

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Default Overlay Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    testMedicineId = medicine.id;
    // Intentionally NOT creating an overlay
  });

  it('should return merged view even without overlay', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged).toBeDefined();
    expect(merged).not.toBeNull();
  });

  it('should include all master fields when no overlay exists', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.canonicalId).toBe(testMedicineId);
    expect(merged?.name).toBe('Default Overlay Test Medicine');
    expect(merged?.compositionText).toBe('Test Salt 100mg');
    expect(merged?.manufacturerName).toBe('Test Pharma');
    expect(merged?.form).toBe('Tablet');
    expect(merged?.packSize).toBe('10 tablets');
    expect(merged?.requiresPrescription).toBe(false);
    expect(merged?.defaultGstRate).toBe(12);
  });

  it('should have undefined overlay fields when no overlay exists', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.customMrp).toBeUndefined();
    expect(merged?.customDiscount).toBeUndefined();
    expect(merged?.customGstRate).toBeUndefined();
    expect(merged?.stockQuantity).toBeUndefined();
    expect(merged?.reorderLevel).toBeUndefined();
    expect(merged?.internalQrCode).toBeUndefined();
    expect(merged?.customNotes).toBeUndefined();
  });

  it('should use default GST rate when no custom rate', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.effectiveGstRate).toBe(12); // Default GST rate
    expect(merged?.effectiveGstRate).toBe(merged?.defaultGstRate);
  });

  it('should indicate no overlay exists', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.hasOverlay).toBe(false);
  });

  it('should default isActive to true when no overlay', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.isActive).toBe(true);
  });

  it('should transition from no overlay to overlay correctly', async () => {
    // First query - no overlay
    const before = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );
    expect(before?.hasOverlay).toBe(false);
    expect(before?.customMrp).toBeUndefined();

    // Create overlay
    await storeOverlayService.setOverlay(testStoreId, testMedicineId, {
      customMrp: 200,
    });

    // Second query - with overlay
    const after = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );
    expect(after?.hasOverlay).toBe(true);
    expect(after?.customMrp).toBe(200);
  });

  it('should handle bulk queries with mixed overlay presence', async () => {
    // Create another medicine with overlay
    const medicine2 = await medicineMasterService.create({
      name: 'Medicine With Overlay',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 5,
    });

    await storeOverlayService.setOverlay(testStoreId, medicine2.id, {
      customMrp: 100,
    });

    // Query both medicines
    const merged = await storeOverlayService.getMergedMedicines(testStoreId, [
      testMedicineId,
      medicine2.id,
    ]);

    expect(merged).toHaveLength(2);

    // First medicine - no overlay (or overlay created in previous test)
    const first = merged.find((m) => m.canonicalId === testMedicineId);
    expect(first).toBeDefined();

    // Second medicine - has overlay
    const second = merged.find((m) => m.canonicalId === medicine2.id);
    expect(second?.hasOverlay).toBe(true);
    expect(second?.customMrp).toBe(100);
  });

  it('should return null for non-existent medicine', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      'non-existent-id'
    );

    expect(merged).toBeNull();
  });

  it('should preserve master data integrity without overlay', async () => {
    const master = await medicineMasterService.getById(testMedicineId);
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    // Master fields should match exactly
    expect(merged?.name).toBe(master?.name);
    expect(merged?.compositionText).toBe(master?.compositionText);
    expect(merged?.manufacturerName).toBe(master?.manufacturerName);
    expect(merged?.defaultGstRate).toBe(parseFloat(master?.defaultGstRate.toString()));
  });
});
