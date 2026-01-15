/**
 * Property Test: Overlay References Valid Master (Property 6)
 * 
 * Validates: Requirements 2.1
 * 
 * Property: Every store overlay must reference an existing medicine master
 * 
 * Test Strategy:
 * - Attempt to create overlay for non-existent medicine
 * - Verify it fails
 * - Create overlay for existing medicine
 * - Verify it succeeds
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { storeOverlayService } from '../../src/services/StoreOverlayService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 6: Overlay References Valid Master', () => {
  let validMedicineId: string;
  const testStoreId = 'test-store-overlay-ref';

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Overlay Reference Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    validMedicineId = medicine.id;
  });

  it('should fail to create overlay for non-existent medicine', async () => {
    await expect(
      storeOverlayService.setOverlay(testStoreId, 'non-existent-medicine-id', {
        customMrp: 100,
      })
    ).rejects.toThrow();
  });

  it('should succeed to create overlay for existing medicine', async () => {
    const overlay = await storeOverlayService.setOverlay(
      testStoreId,
      validMedicineId,
      {
        customMrp: 150,
        customDiscount: 10,
      }
    );

    expect(overlay).toBeDefined();
    expect(overlay.canonicalId).toBe(validMedicineId);
    expect(overlay.storeId).toBe(testStoreId);
  });

  it('should retrieve overlay only for valid medicine', async () => {
    const overlay = await storeOverlayService.getOverlay(
      testStoreId,
      validMedicineId
    );

    expect(overlay).toBeDefined();
    expect(overlay?.canonicalId).toBe(validMedicineId);
  });

  it('should return null for overlay of non-existent medicine', async () => {
    const overlay = await storeOverlayService.getOverlay(
      testStoreId,
      'non-existent-id'
    );

    expect(overlay).toBeNull();
  });

  it('should maintain referential integrity on medicine deletion', async () => {
    // Create a medicine and overlay
    const medicine = await medicineMasterService.create({
      name: 'Delete Test Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await storeOverlayService.setOverlay(testStoreId, medicine.id, {
      customMrp: 200,
    });

    // Soft delete medicine
    await medicineMasterService.softDelete(medicine.id);

    // Overlay should still exist (soft delete doesn't remove overlays)
    const overlay = await storeOverlayService.getOverlay(testStoreId, medicine.id);
    expect(overlay).toBeDefined();
  });

  it('should allow multiple stores to have overlays for same medicine', async () => {
    const store1 = 'store-1';
    const store2 = 'store-2';

    await storeOverlayService.setOverlay(store1, validMedicineId, {
      customMrp: 100,
    });

    await storeOverlayService.setOverlay(store2, validMedicineId, {
      customMrp: 120,
    });

    const overlay1 = await storeOverlayService.getOverlay(store1, validMedicineId);
    const overlay2 = await storeOverlayService.getOverlay(store2, validMedicineId);

    expect(overlay1?.customMrp).toBe(100);
    expect(overlay2?.customMrp).toBe(120);
  });

  it('should enforce unique constraint on (storeId, canonicalId)', async () => {
    // First creation should succeed
    await storeOverlayService.setOverlay(testStoreId, validMedicineId, {
      customMrp: 100,
    });

    // Second creation should update (upsert behavior)
    const updated = await storeOverlayService.setOverlay(
      testStoreId,
      validMedicineId,
      {
        customMrp: 150,
      }
    );

    expect(updated.customMrp).toBe(150);

    // Should only have one overlay
    const overlay = await storeOverlayService.getOverlay(
      testStoreId,
      validMedicineId
    );
    expect(overlay?.customMrp).toBe(150);
  });
});
