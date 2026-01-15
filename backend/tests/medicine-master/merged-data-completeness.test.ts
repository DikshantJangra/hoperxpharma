/**
 * Property Test: Merged Data Completeness (Property 8)
 * 
 * Validates: Requirements 2.4
 * 
 * Property: Merged view must contain all master fields plus overlay fields
 * 
 * Test Strategy:
 * - Create medicine and overlay
 * - Get merged view
 * - Verify all master fields present
 * - Verify all overlay fields present
 * - Verify computed fields correct
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { storeOverlayService } from '../../src/services/StoreOverlayService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 8: Merged Data Completeness', () => {
  let testMedicineId: string;
  const testStoreId = 'test-store-merged';

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Merged Test Medicine',
      genericName: 'Generic Merged',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 12,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
    });
    testMedicineId = medicine.id;

    await storeOverlayService.setOverlay(testStoreId, testMedicineId, {
      customMrp: 150,
      customDiscount: 10,
      customGstRate: 18,
      stockQuantity: 100,
      reorderLevel: 20,
      internalQrCode: 'QR-12345',
      customNotes: 'Test notes',
      isActive: true,
    });
  });

  it('should include all master fields in merged view', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged).toBeDefined();
    expect(merged?.canonicalId).toBe(testMedicineId);
    expect(merged?.name).toBe('Merged Test Medicine');
    expect(merged?.genericName).toBe('Generic Merged');
    expect(merged?.compositionText).toBe('Test Salt 100mg');
    expect(merged?.manufacturerName).toBe('Test Pharma');
    expect(merged?.form).toBe('Tablet');
    expect(merged?.packSize).toBe('10 tablets');
    expect(merged?.schedule).toBe('H');
    expect(merged?.requiresPrescription).toBe(true);
    expect(merged?.defaultGstRate).toBe(12);
    expect(merged?.hsnCode).toBe('30049099');
    expect(merged?.primaryBarcode).toBe('1234567890123');
  });

  it('should include all overlay fields in merged view', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.customMrp).toBe(150);
    expect(merged?.customDiscount).toBe(10);
    expect(merged?.customGstRate).toBe(18);
    expect(merged?.stockQuantity).toBe(100);
    expect(merged?.reorderLevel).toBe(20);
    expect(merged?.internalQrCode).toBe('QR-12345');
    expect(merged?.customNotes).toBe('Test notes');
    expect(merged?.isActive).toBe(true);
  });

  it('should include computed fields in merged view', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.effectiveGstRate).toBe(18); // Custom GST rate
    expect(merged?.hasOverlay).toBe(true);
  });

  it('should use custom GST rate when available', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.effectiveGstRate).toBe(18);
    expect(merged?.effectiveGstRate).not.toBe(merged?.defaultGstRate);
  });

  it('should use default GST rate when no custom rate', async () => {
    // Create medicine without custom GST
    const medicine2 = await medicineMasterService.create({
      name: 'No Custom GST Medicine',
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

    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      medicine2.id
    );

    expect(merged?.effectiveGstRate).toBe(5); // Default GST rate
  });

  it('should handle bulk merged queries', async () => {
    const merged = await storeOverlayService.getMergedMedicines(
      testStoreId,
      [testMedicineId]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].canonicalId).toBe(testMedicineId);
    expect(merged[0].customMrp).toBe(150);
  });

  it('should preserve data types in merged view', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(typeof merged?.customMrp).toBe('number');
    expect(typeof merged?.customDiscount).toBe('number');
    expect(typeof merged?.stockQuantity).toBe('number');
    expect(typeof merged?.requiresPrescription).toBe('boolean');
    expect(typeof merged?.isActive).toBe('boolean');
  });

  it('should include metadata fields', async () => {
    const merged = await storeOverlayService.getMergedMedicine(
      testStoreId,
      testMedicineId
    );

    expect(merged?.confidenceScore).toBeDefined();
    expect(merged?.usageCount).toBeDefined();
    expect(merged?.status).toBeDefined();
  });
});
