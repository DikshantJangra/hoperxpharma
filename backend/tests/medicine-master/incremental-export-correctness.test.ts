/**
 * Property Test: Incremental Export Correctness (Property 37)
 * 
 * Validates: Requirements 10.2
 * 
 * Property: Incremental export should only return medicines changed since specified date
 * 
 * Test Strategy:
 * - Create medicines at different times
 * - Export changes since specific date
 * - Verify only medicines changed after that date are returned
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { exportService } from '../../src/services/ExportService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 37: Incremental Export Correctness', () => {
  let oldMedicineId: string;
  let newMedicineId: string;
  let cutoffDate: Date;

  beforeAll(async () => {
    // Create old medicine
    const oldMedicine = await medicineMasterService.create({
      name: 'Old Medicine',
      compositionText: 'Old Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    oldMedicineId = oldMedicine.id;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Set cutoff date
    cutoffDate = new Date();

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create new medicine
    const newMedicine = await medicineMasterService.create({
      name: 'New Medicine',
      compositionText: 'New Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    newMedicineId = newMedicine.id;
  });

  it('should only return medicines changed after cutoff date', async () => {
    const changes = await exportService.exportChanges(cutoffDate);

    // Should include new medicine
    const hasNew = changes.some(m => m.canonicalId === newMedicineId);
    expect(hasNew).toBe(true);

    // Should not include old medicine
    const hasOld = changes.some(m => m.canonicalId === oldMedicineId);
    expect(hasOld).toBe(false);
  });

  it('should include updated medicines', async () => {
    // Update old medicine
    await medicineMasterService.update(oldMedicineId, {
      confidenceScore: 90,
    });

    const changes = await exportService.exportChanges(cutoffDate);

    // Should now include old medicine (because it was updated)
    const hasOld = changes.some(m => m.canonicalId === oldMedicineId);
    expect(hasOld).toBe(true);
  });

  it('should respect pagination', async () => {
    const page1 = await exportService.exportChanges(cutoffDate, {
      skip: 0,
      take: 1,
    });

    const page2 = await exportService.exportChanges(cutoffDate, {
      skip: 1,
      take: 1,
    });

    // Should return different medicines
    if (page1.length > 0 && page2.length > 0) {
      expect(page1[0].canonicalId).not.toBe(page2[0].canonicalId);
    }
  });

  it('should return empty array when no changes', async () => {
    const futureDate = new Date(Date.now() + 1000000);
    const changes = await exportService.exportChanges(futureDate);

    expect(changes).toHaveLength(0);
  });

  it('should filter by status if provided', async () => {
    const changes = await exportService.exportChanges(cutoffDate, {
      status: 'VERIFIED',
    });

    // All returned medicines should have VERIFIED status
    const allVerified = changes.every(m => m.status === 'VERIFIED');
    expect(allVerified).toBe(true);
  });

  it('should return medicines in chronological order', async () => {
    const changes = await exportService.exportChanges(cutoffDate);

    if (changes.length > 1) {
      for (let i = 0; i < changes.length - 1; i++) {
        const current = new Date(changes[i].updatedAt);
        const next = new Date(changes[i + 1].updatedAt);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  it('should handle exact cutoff time correctly', async () => {
    // Create medicine
    const medicine = await medicineMasterService.create({
      name: 'Exact Time Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    // Use exact creation time as cutoff
    const exactCutoff = medicine.createdAt;

    const changes = await exportService.exportChanges(exactCutoff);

    // Should include medicine (>= cutoff)
    const found = changes.some(m => m.canonicalId === medicine.id);
    expect(found).toBe(true);
  });

  it('should handle multiple updates correctly', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Multiple Updates Medicine',
      compositionText: 'Test Salt 75mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });

    const beforeUpdates = new Date();

    // Make multiple updates
    await medicineMasterService.update(medicine.id, { confidenceScore: 80 });
    await new Promise(resolve => setTimeout(resolve, 50));
    await medicineMasterService.update(medicine.id, { confidenceScore: 85 });
    await new Promise(resolve => setTimeout(resolve, 50));
    await medicineMasterService.update(medicine.id, { confidenceScore: 90 });

    const changes = await exportService.exportChanges(beforeUpdates);

    // Should appear once (latest version)
    const matches = changes.filter(m => m.canonicalId === medicine.id);
    expect(matches.length).toBe(1);
    expect(matches[0].confidenceScore).toBe(90);
  });
});
