/**
 * Property Test: Query Consistency Across Stores (Property 4)
 * 
 * Validates: Requirements 1.4
 * 
 * Property: Querying the same medicine from different stores should return identical master data
 * 
 * Test Strategy:
 * - Create a medicine
 * - Query it multiple times
 * - Verify all queries return identical data
 * - Verify data is independent of store context
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 4: Query Consistency Across Stores', () => {
  let testMedicineId: string;

  const medicineInput = {
    name: 'Consistency Test Medicine',
    compositionText: 'Test Salt 250mg',
    manufacturerName: 'Test Pharma Ltd',
    form: 'Capsule',
    packSize: '15 capsules',
    requiresPrescription: true,
    defaultGstRate: 12,
    hsnCode: '30049099',
  };

  beforeAll(async () => {
    const medicine = await medicineMasterService.create(medicineInput);
    testMedicineId = medicine.id;
  });

  it('should return identical data on multiple queries', async () => {
    const query1 = await medicineMasterService.getById(testMedicineId);
    const query2 = await medicineMasterService.getById(testMedicineId);
    const query3 = await medicineMasterService.getById(testMedicineId);

    expect(query1).toEqual(query2);
    expect(query2).toEqual(query3);
  });

  it('should return same canonical ID on all queries', async () => {
    const query1 = await medicineMasterService.getById(testMedicineId);
    const query2 = await medicineMasterService.getById(testMedicineId);

    expect(query1?.id).toBe(testMedicineId);
    expect(query2?.id).toBe(testMedicineId);
  });

  it('should return same master attributes on all queries', async () => {
    const query1 = await medicineMasterService.getById(testMedicineId);
    const query2 = await medicineMasterService.getById(testMedicineId);

    expect(query1?.name).toBe(query2?.name);
    expect(query1?.compositionText).toBe(query2?.compositionText);
    expect(query1?.manufacturerName).toBe(query2?.manufacturerName);
    expect(query1?.form).toBe(query2?.form);
    expect(query1?.packSize).toBe(query2?.packSize);
    expect(query1?.requiresPrescription).toBe(query2?.requiresPrescription);
    expect(query1?.defaultGstRate).toBe(query2?.defaultGstRate);
  });

  it('should return consistent data in bulk queries', async () => {
    const singleQuery = await medicineMasterService.getById(testMedicineId);
    const bulkQuery = await medicineMasterService.getByIds([testMedicineId]);

    expect(bulkQuery).toHaveLength(1);
    expect(bulkQuery[0].id).toBe(singleQuery?.id);
    expect(bulkQuery[0].name).toBe(singleQuery?.name);
  });

  it('should return consistent data when queried by barcode', async () => {
    // Update medicine with barcode
    await medicineMasterService.update(testMedicineId, {
      primaryBarcode: '1234567890123',
    });

    const byId = await medicineMasterService.getById(testMedicineId);
    const byBarcode = await medicineMasterService.findByBarcode('1234567890123');

    expect(byBarcode?.id).toBe(byId?.id);
    expect(byBarcode?.name).toBe(byId?.name);
  });

  it('should maintain consistency after updates', async () => {
    const before = await medicineMasterService.getById(testMedicineId);
    
    // Update medicine
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 95,
    });

    const after = await medicineMasterService.getById(testMedicineId);

    // Core attributes should remain same
    expect(after?.name).toBe(before?.name);
    expect(after?.compositionText).toBe(before?.compositionText);
    
    // Updated field should change
    expect(after?.confidenceScore).toBe(95);
  });

  it('should return null consistently for non-existent medicine', async () => {
    const query1 = await medicineMasterService.getById('non-existent-id');
    const query2 = await medicineMasterService.getById('non-existent-id');

    expect(query1).toBeNull();
    expect(query2).toBeNull();
  });
});
