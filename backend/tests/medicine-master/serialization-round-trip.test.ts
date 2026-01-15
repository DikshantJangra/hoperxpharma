/**
 * Property Test: Serialization Round-Trip (Property 36)
 * 
 * Validates: Requirements 10.1, 10.4, 10.5
 * 
 * Property: Serializing then deserializing should produce equivalent data
 * 
 * Test Strategy:
 * - Create medicine objects
 * - Serialize to JSON
 * - Deserialize back
 * - Verify data matches original
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { exportService } from '../../src/services/ExportService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 36: Serialization Round-Trip', () => {
  let testMedicineId: string;
  let testMedicine: any;

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Serialization Test Medicine',
      genericName: 'Generic Test',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 12,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
      alternateBarcodes: ['9876543210987'],
      confidenceScore: 95,
    });
    testMedicineId = medicine.id;
    testMedicine = medicine;
  });

  it('should preserve all fields in round-trip', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    // Serialize
    const serialized = exportService.serialize(medicine);

    // Deserialize
    const deserialized = exportService.deserialize(serialized);

    // Verify core fields match
    expect(deserialized.id).toBe(medicine.id);
    expect(deserialized.name).toBe(medicine.name);
    expect(deserialized.genericName).toBe(medicine.genericName);
    expect(deserialized.compositionText).toBe(medicine.compositionText);
    expect(deserialized.manufacturerName).toBe(medicine.manufacturerName);
    expect(deserialized.form).toBe(medicine.form);
    expect(deserialized.packSize).toBe(medicine.packSize);
    expect(deserialized.schedule).toBe(medicine.schedule);
    expect(deserialized.requiresPrescription).toBe(medicine.requiresPrescription);
    expect(deserialized.defaultGstRate).toBe(parseFloat(medicine.defaultGstRate.toString()));
    expect(deserialized.hsnCode).toBe(medicine.hsnCode);
    expect(deserialized.primaryBarcode).toBe(medicine.primaryBarcode);
    expect(deserialized.status).toBe(medicine.status);
    expect(deserialized.confidenceScore).toBe(medicine.confidenceScore);
    expect(deserialized.usageCount).toBe(medicine.usageCount);
  });

  it('should preserve arrays in round-trip', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    const serialized = exportService.serialize(medicine);
    const deserialized = exportService.deserialize(serialized);

    expect(Array.isArray(deserialized.alternateBarcodes)).toBe(true);
    expect(deserialized.alternateBarcodes).toEqual(medicine.alternateBarcodes);
  });

  it('should preserve dates in round-trip', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    const serialized = exportService.serialize(medicine);
    const deserialized = exportService.deserialize(serialized);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBeInstanceOf(Date);
    expect(deserialized.createdAt.getTime()).toBe(medicine.createdAt.getTime());
    expect(deserialized.updatedAt.getTime()).toBe(medicine.updatedAt.getTime());
  });

  it('should handle optional fields correctly', async () => {
    // Create medicine with minimal fields
    const minimalMedicine = await medicineMasterService.create({
      name: 'Minimal Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Capsule',
      packSize: '5 capsules',
      requiresPrescription: false,
      defaultGstRate: 5,
    });

    const serialized = exportService.serialize(minimalMedicine);
    const deserialized = exportService.deserialize(serialized);

    expect(deserialized.genericName).toBeUndefined();
    expect(deserialized.schedule).toBeUndefined();
    expect(deserialized.hsnCode).toBeUndefined();
    expect(deserialized.primaryBarcode).toBeUndefined();
  });

  it('should be idempotent (multiple round-trips)', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    // First round-trip
    const serialized1 = exportService.serialize(medicine);
    const deserialized1 = exportService.deserialize(serialized1);

    // Second round-trip
    const serialized2 = exportService.serialize(deserialized1);
    const deserialized2 = exportService.deserialize(serialized2);

    // Third round-trip
    const serialized3 = exportService.serialize(deserialized2);
    const deserialized3 = exportService.deserialize(serialized3);

    // All should be equivalent
    expect(deserialized1.id).toBe(deserialized2.id);
    expect(deserialized2.id).toBe(deserialized3.id);
    expect(deserialized1.name).toBe(deserialized3.name);
  });

  it('should produce valid JSON', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    const serialized = exportService.serialize(medicine);
    const jsonString = JSON.stringify(serialized);

    // Should be valid JSON
    expect(() => JSON.parse(jsonString)).not.toThrow();

    // Parsed JSON should match serialized
    const parsed = JSON.parse(jsonString);
    expect(parsed.canonicalId).toBe(serialized.canonicalId);
    expect(parsed.name).toBe(serialized.name);
  });

  it('should handle special characters in strings', async () => {
    const specialMedicine = await medicineMasterService.create({
      name: 'Medicine with "quotes" and \\backslashes\\',
      compositionText: 'Salt with special chars: @#$%',
      manufacturerName: 'Manufacturer & Co.',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    const serialized = exportService.serialize(specialMedicine);
    const deserialized = exportService.deserialize(serialized);

    expect(deserialized.name).toBe(specialMedicine.name);
    expect(deserialized.compositionText).toBe(specialMedicine.compositionText);
    expect(deserialized.manufacturerName).toBe(specialMedicine.manufacturerName);
  });

  it('should preserve numeric precision', async () => {
    const medicine = await medicineMasterService.getById(testMedicineId);

    const serialized = exportService.serialize(medicine);
    const deserialized = exportService.deserialize(serialized);

    expect(deserialized.defaultGstRate).toBe(12);
    expect(deserialized.confidenceScore).toBe(95);
    expect(deserialized.usageCount).toBe(medicine.usageCount);
  });

  it('should handle empty arrays', async () => {
    const medicine = await medicineMasterService.create({
      name: 'No Barcodes Medicine',
      compositionText: 'Test Salt 25mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      alternateBarcodes: [],
    });

    const serialized = exportService.serialize(medicine);
    const deserialized = exportService.deserialize(serialized);

    expect(Array.isArray(deserialized.alternateBarcodes)).toBe(true);
    expect(deserialized.alternateBarcodes).toHaveLength(0);
  });
});
