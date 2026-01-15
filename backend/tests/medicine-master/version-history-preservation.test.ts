/**
 * Property Test: Version History Preservation (Property 27)
 * 
 * Validates: Requirements 8.1, 8.2
 * 
 * Property: Every change to a medicine must create a version record
 * 
 * Test Strategy:
 * - Create a medicine
 * - Make multiple updates
 * - Verify version history contains all changes
 * - Verify version numbers are sequential
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 27: Version History Preservation', () => {
  let testMedicineId: string;

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Version Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    testMedicineId = medicine.id;
  });

  it('should create initial version on medicine creation', async () => {
    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].changeType).toBe('CREATED');
    expect(history[0].versionNumber).toBe(1);
  });

  it('should create version on update', async () => {
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 85,
    });

    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].changeType).toBe('UPDATED');
  });

  it('should preserve version numbers in sequence', async () => {
    // Make multiple updates
    await medicineMasterService.update(testMedicineId, { confidenceScore: 90 });
    await medicineMasterService.update(testMedicineId, { confidenceScore: 95 });

    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    
    // Verify sequential version numbers (descending order)
    for (let i = 0; i < history.length - 1; i++) {
      expect(history[i].versionNumber).toBeGreaterThan(history[i + 1].versionNumber);
    }
  });

  it('should store complete snapshot in each version', async () => {
    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    
    for (const version of history) {
      expect(version.snapshotData).toBeDefined();
      const snapshot = version.snapshotData as any;
      
      expect(snapshot.name).toBeDefined();
      expect(snapshot.compositionText).toBeDefined();
      expect(snapshot.manufacturerName).toBeDefined();
    }
  });

  it('should track change metadata', async () => {
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 100,
    }, 'test-user');

    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    const latestVersion = history[0];
    
    expect(latestVersion.changedBy).toBe('test-user');
    expect(latestVersion.changedAt).toBeDefined();
  });

  it('should create version on soft delete', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Delete Test Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await medicineMasterService.softDelete(medicine.id, 'test-user');

    const history = await medicineMasterService.getVersionHistory(medicine.id);
    const discontinuedVersion = history.find((v) => v.changeType === 'DISCONTINUED');
    
    expect(discontinuedVersion).toBeDefined();
  });

  it('should preserve all historical versions', async () => {
    const initialHistory = await medicineMasterService.getVersionHistory(testMedicineId);
    const initialCount = initialHistory.length;

    // Make more updates
    await medicineMasterService.update(testMedicineId, { confidenceScore: 80 });
    await medicineMasterService.update(testMedicineId, { confidenceScore: 85 });

    const updatedHistory = await medicineMasterService.getVersionHistory(testMedicineId);
    
    // Should have more versions now
    expect(updatedHistory.length).toBe(initialCount + 2);
    
    // Old versions should still exist
    const oldVersionNumbers = initialHistory.map((v) => v.versionNumber);
    const newVersionNumbers = updatedHistory.map((v) => v.versionNumber);
    
    for (const oldNum of oldVersionNumbers) {
      expect(newVersionNumbers).toContain(oldNum);
    }
  });
});
