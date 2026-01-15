/**
 * Property Test: Soft Delete Preservation (Property 31)
 * 
 * Validates: Requirements 8.7
 * 
 * Property: Soft deleted medicines should be preserved for historical queries
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { dataGovernanceService } from '../../src/services/DataGovernanceService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';
import { MedicineStatus } from '@prisma/client';

describe('Property 31: Soft Delete Preservation', () => {
  let testMedicineId: string;

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'Soft Delete Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    testMedicineId = medicine.id;
  });

  it('should preserve medicine record after soft delete', async () => {
    await dataGovernanceService.discontinueMedicine(testMedicineId, 'Test reason');

    const medicine = await medicineMasterService.getById(testMedicineId);

    expect(medicine).not.toBeNull();
    expect(medicine?.id).toBe(testMedicineId);
  });

  it('should mark medicine as DISCONTINUED after soft delete', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Another Test Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await dataGovernanceService.discontinueMedicine(medicine.id);

    const updated = await medicineMasterService.getById(medicine.id);

    expect(updated?.status).toBe(MedicineStatus.DISCONTINUED);
  });

  it('should preserve all medicine data after soft delete', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Data Preservation Test',
      genericName: 'Generic Test',
      compositionText: 'Test Salt 75mg',
      manufacturerName: 'Test Pharma',
      form: 'Capsule',
      packSize: '15 capsules',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 18,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
    });

    const beforeDelete = { ...medicine };

    await dataGovernanceService.discontinueMedicine(medicine.id);

    const afterDelete = await medicineMasterService.getById(medicine.id);

    expect(afterDelete?.name).toBe(beforeDelete.name);
    expect(afterDelete?.genericName).toBe(beforeDelete.genericName);
    expect(afterDelete?.compositionText).toBe(beforeDelete.compositionText);
    expect(afterDelete?.manufacturerName).toBe(beforeDelete.manufacturerName);
    expect(afterDelete?.form).toBe(beforeDelete.form);
    expect(afterDelete?.packSize).toBe(beforeDelete.packSize);
    expect(afterDelete?.schedule).toBe(beforeDelete.schedule);
    expect(afterDelete?.requiresPrescription).toBe(beforeDelete.requiresPrescription);
    expect(afterDelete?.hsnCode).toBe(beforeDelete.hsnCode);
    expect(afterDelete?.primaryBarcode).toBe(beforeDelete.primaryBarcode);
  });

  it('should allow querying discontinued medicine by ID', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Query Test Medicine',
      compositionText: 'Test Salt 25mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await dataGovernanceService.discontinueMedicine(medicine.id);

    const queried = await medicineMasterService.getById(medicine.id);

    expect(queried).not.toBeNull();
    expect(queried?.id).toBe(medicine.id);
  });

  it('should create version record for discontinuation', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Version Test Medicine',
      compositionText: 'Test Salt 30mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await dataGovernanceService.discontinueMedicine(medicine.id, 'Test reason', 'test-user');

    const versions = await medicineMasterService.getVersionHistory(medicine.id);

    const discontinuedVersion = versions.find(v => v.changeType === 'DISCONTINUED');
    expect(discontinuedVersion).toBeDefined();
  });

  it('should allow restoring discontinued medicine', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Restore Test Medicine',
      compositionText: 'Test Salt 40mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await dataGovernanceService.discontinueMedicine(medicine.id);
    await dataGovernanceService.restoreMedicine(medicine.id, 'test-user');

    const restored = await medicineMasterService.getById(medicine.id);

    expect(restored?.status).not.toBe(MedicineStatus.DISCONTINUED);
  });

  it('should preserve historical data for auditing', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Audit Test Medicine',
      compositionText: 'Test Salt 60mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    const originalCreatedAt = medicine.createdAt;

    await dataGovernanceService.discontinueMedicine(medicine.id);

    const discontinued = await medicineMasterService.getById(medicine.id);

    // Original creation date should be preserved
    expect(discontinued?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
  });

  it('should not physically delete medicine from database', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Physical Delete Test',
      compositionText: 'Test Salt 80mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    await dataGovernanceService.discontinueMedicine(medicine.id);

    // Should still be retrievable
    const exists = await medicineMasterService.getById(medicine.id);
    expect(exists).not.toBeNull();
  });
});
