/**
 * Property Test: Deduplication Determinism (Property 22)
 * 
 * Validates: Requirements 5.3
 * 
 * Property: Finding duplicates for the same input should always return the same results
 * 
 * Test Strategy:
 * - Create test medicines
 * - Find duplicates multiple times
 * - Verify results are consistent
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { migrationService } from '../../src/services/MigrationService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 22: Deduplication Determinism', () => {
  let testMedicineId: string;

  const testInput = {
    name: 'Paracetamol 500mg Tablet',
    compositionText: 'Paracetamol 500mg',
    manufacturerName: 'Test Pharma',
    form: 'Tablet',
    packSize: '10 tablets',
    requiresPrescription: false,
    defaultGstRate: 12,
  };

  beforeAll(async () => {
    const medicine = await medicineMasterService.create(testInput);
    testMedicineId = medicine.id;
  });

  it('should return consistent results on multiple duplicate checks', async () => {
    const similarInput = {
      name: 'Paracetamol 500mg Tablets', // Slightly different
      compositionText: 'Paracetamol 500mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    };

    const result1 = await migrationService.findPotentialDuplicates(similarInput);
    const result2 = await migrationService.findPotentialDuplicates(similarInput);
    const result3 = await migrationService.findPotentialDuplicates(similarInput);

    expect(result1.length).toBe(result2.length);
    expect(result2.length).toBe(result3.length);

    if (result1.length > 0) {
      expect(result1[0].medicine.id).toBe(result2[0].medicine.id);
      expect(result2[0].medicine.id).toBe(result3[0].medicine.id);
    }
  });

  it('should return same similarity scores on repeated checks', async () => {
    const result1 = await migrationService.findPotentialDuplicates(testInput);
    const result2 = await migrationService.findPotentialDuplicates(testInput);

    if (result1.length > 0 && result2.length > 0) {
      expect(result1[0].nameScore).toBe(result2[0].nameScore);
      expect(result1[0].compositionScore).toBe(result2[0].compositionScore);
      expect(result1[0].overallScore).toBe(result2[0].overallScore);
    }
  });

  it('should find exact match as duplicate', async () => {
    const duplicates = await migrationService.findPotentialDuplicates(testInput);

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].medicine.id).toBe(testMedicineId);
    expect(duplicates[0].overallScore).toBeGreaterThanOrEqual(95);
  });

  it('should not find duplicates for very different medicine', async () => {
    const differentInput = {
      name: 'Completely Different Medicine',
      compositionText: 'Different Salt 100mg',
      manufacturerName: 'Different Manufacturer',
      form: 'Capsule',
      packSize: '20 capsules',
      requiresPrescription: true,
      defaultGstRate: 18,
    };

    const duplicates = await migrationService.findPotentialDuplicates(differentInput);

    // Should not find the test medicine as duplicate
    const foundTest = duplicates.some((d) => d.medicine.id === testMedicineId);
    expect(foundTest).toBe(false);
  });

  it('should rank duplicates by similarity score', async () => {
    const duplicates = await migrationService.findPotentialDuplicates(testInput);

    if (duplicates.length > 1) {
      for (let i = 0; i < duplicates.length - 1; i++) {
        expect(duplicates[i].overallScore).toBeGreaterThanOrEqual(
          duplicates[i + 1].overallScore
        );
      }
    }
  });

  it('should respect similarity threshold', async () => {
    const lowThreshold = await migrationService.findPotentialDuplicates(testInput, 50);
    const highThreshold = await migrationService.findPotentialDuplicates(testInput, 95);

    expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
  });

  it('should handle case-insensitive matching', async () => {
    const lowerCase = {
      ...testInput,
      name: testInput.name.toLowerCase(),
      manufacturerName: testInput.manufacturerName.toLowerCase(),
    };

    const upperCase = {
      ...testInput,
      name: testInput.name.toUpperCase(),
      manufacturerName: testInput.manufacturerName.toUpperCase(),
    };

    const result1 = await migrationService.findPotentialDuplicates(lowerCase);
    const result2 = await migrationService.findPotentialDuplicates(upperCase);

    expect(result1.length).toBe(result2.length);
  });
});
