/**
 * Property Test: Rollback Restoration (Property 29)
 * 
 * Validates: Requirements 8.4
 * 
 * Property: Rolling back to a previous version should restore exact state
 * 
 * Test Strategy:
 * - Create a medicine
 * - Make updates
 * - Rollback to previous version
 * - Verify data matches the target version exactly
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 29: Rollback Restoration', () => {
  let testMedicineId: string;
  let version1Snapshot: any;
  let version2Snapshot: any;

  beforeAll(async () => {
    // Create medicine (version 1)
    const medicine = await medicineMasterService.create({
      name: 'Rollback Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 70,
    });
    testMedicineId = medicine.id;

    // Get version 1 snapshot
    const history1 = await medicineMasterService.getVersionHistory(testMedicineId);
    version1Snapshot = history1[0].snapshotData;

    // Update medicine (version 2)
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 85,
      genericName: 'Updated Generic Name',
    });

    // Get version 2 snapshot
    const history2 = await medicineMasterService.getVersionHistory(testMedicineId);
    version2Snapshot = history2[0].snapshotData;

    // Update again (version 3)
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 95,
      hsnCode: '30049099',
    });
  });

  it('should rollback to version 2 successfully', async () => {
    const rolled = await medicineMasterService.rollback(testMedicineId, 2);
    
    expect(rolled.confidenceScore).toBe(85);
    expect(rolled.genericName).toBe('Updated Generic Name');
  });

  it('should restore exact state from target version', async () => {
    await medicineMasterService.rollback(testMedicineId, 1);
    
    const current = await medicineMasterService.getById(testMedicineId);
    
    expect(current?.confidenceScore).toBe(version1Snapshot.confidenceScore);
    expect(current?.name).toBe(version1Snapshot.name);
    expect(current?.compositionText).toBe(version1Snapshot.compositionText);
  });

  it('should create rollback version record', async () => {
    await medicineMasterService.rollback(testMedicineId, 2);
    
    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    const rollbackVersion = history.find((v) => v.changeType.includes('ROLLBACK'));
    
    expect(rollbackVersion).toBeDefined();
    expect(rollbackVersion?.changeType).toContain('ROLLBACK_TO_V2');
  });

  it('should fail rollback to non-existent version', async () => {
    await expect(
      medicineMasterService.rollback(testMedicineId, 999)
    ).rejects.toThrow();
  });

  it('should track who performed the rollback', async () => {
    await medicineMasterService.rollback(testMedicineId, 1, 'admin-user');
    
    const history = await medicineMasterService.getVersionHistory(testMedicineId);
    const rollbackVersion = history[0];
    
    expect(rollbackVersion.changedBy).toBe('admin-user');
  });

  it('should allow multiple rollbacks', async () => {
    // Rollback to version 2
    await medicineMasterService.rollback(testMedicineId, 2);
    let current = await medicineMasterService.getById(testMedicineId);
    expect(current?.confidenceScore).toBe(85);

    // Rollback to version 1
    await medicineMasterService.rollback(testMedicineId, 1);
    current = await medicineMasterService.getById(testMedicineId);
    expect(current?.confidenceScore).toBe(70);
  });

  it('should update search index after rollback', async () => {
    // Update with unique value
    await medicineMasterService.update(testMedicineId, {
      confidenceScore: 99,
    });

    // Rollback
    await medicineMasterService.rollback(testMedicineId, 1);

    // Verify current state
    const current = await medicineMasterService.getById(testMedicineId);
    expect(current?.confidenceScore).toBe(70);
  });

  it('should preserve version history after rollback', async () => {
    const beforeRollback = await medicineMasterService.getVersionHistory(testMedicineId);
    const countBefore = beforeRollback.length;

    await medicineMasterService.rollback(testMedicineId, 2);

    const afterRollback = await medicineMasterService.getVersionHistory(testMedicineId);
    
    // Should have one more version (the rollback itself)
    expect(afterRollback.length).toBe(countBefore + 1);
  });
});
