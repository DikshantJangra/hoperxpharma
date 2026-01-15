/**
 * Property Test: Promotion Criteria (Property 19)
 * 
 * Validates: Requirements 4.6
 * 
 * Property: Medicine should be promoted to VERIFIED when confidence >= 80 AND usedByStoreCount >= 3
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ingestionPipelineService } from '../../src/services/IngestionPipelineService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';
import { PrismaClient, IngestionSource } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 19: Promotion Criteria', () => {
  it('should not promote with low confidence', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Low Confidence Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 70, // Below threshold
    });

    // Create pending entry with high usage
    await prisma.pendingMedicine.create({
      data: {
        name: medicine.name,
        compositionText: medicine.compositionText,
        manufacturerName: medicine.manufacturerName,
        form: medicine.form,
        packSize: medicine.packSize,
        requiresPrescription: medicine.requiresPrescription,
        defaultGstRate: medicine.defaultGstRate,
        source: IngestionSource.MANUAL,
        submittedBy: 'test-store',
        confidenceScore: 70,
        usedByStoreCount: 5, // Above threshold
        promotedToCanonicalId: medicine.id,
      },
    });

    const promoted = await ingestionPipelineService.checkPromotionEligibility(medicine.id);
    expect(promoted).toBe(false);

    const updated = await medicineMasterService.getById(medicine.id);
    expect(updated?.status).not.toBe('VERIFIED');
  });

  it('should not promote with low usage count', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Low Usage Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 90, // Above threshold
    });

    // Create pending entry with low usage
    await prisma.pendingMedicine.create({
      data: {
        name: medicine.name,
        compositionText: medicine.compositionText,
        manufacturerName: medicine.manufacturerName,
        form: medicine.form,
        packSize: medicine.packSize,
        requiresPrescription: medicine.requiresPrescription,
        defaultGstRate: medicine.defaultGstRate,
        source: IngestionSource.MANUAL,
        submittedBy: 'test-store',
        confidenceScore: 90,
        usedByStoreCount: 2, // Below threshold
        promotedToCanonicalId: medicine.id,
      },
    });

    const promoted = await ingestionPipelineService.checkPromotionEligibility(medicine.id);
    expect(promoted).toBe(false);
  });

  it('should promote when both criteria met', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Eligible Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 85, // Above threshold
    });

    // Create pending entry with sufficient usage
    await prisma.pendingMedicine.create({
      data: {
        name: medicine.name,
        compositionText: medicine.compositionText,
        manufacturerName: medicine.manufacturerName,
        form: medicine.form,
        packSize: medicine.packSize,
        requiresPrescription: medicine.requiresPrescription,
        defaultGstRate: medicine.defaultGstRate,
        source: IngestionSource.MANUAL,
        submittedBy: 'test-store',
        confidenceScore: 85,
        usedByStoreCount: 3, // Exactly at threshold
        promotedToCanonicalId: medicine.id,
      },
    });

    const promoted = await ingestionPipelineService.checkPromotionEligibility(medicine.id);
    expect(promoted).toBe(true);

    const updated = await medicineMasterService.getById(medicine.id);
    expect(updated?.status).toBe('VERIFIED');
  });

  it('should promote with confidence exactly at 80', async () => {
    const medicine = await medicineMasterService.create({
      name: 'Threshold Confidence Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 80, // Exactly at threshold
    });

    await prisma.pendingMedicine.create({
      data: {
        name: medicine.name,
        compositionText: medicine.compositionText,
        manufacturerName: medicine.manufacturerName,
        form: medicine.form,
        packSize: medicine.packSize,
        requiresPrescription: medicine.requiresPrescription,
        defaultGstRate: medicine.defaultGstRate,
        source: IngestionSource.MANUAL,
        submittedBy: 'test-store',
        confidenceScore: 80,
        usedByStoreCount: 3,
        promotedToCanonicalId: medicine.id,
      },
    });

    const promoted = await ingestionPipelineService.checkPromotionEligibility(medicine.id);
    expect(promoted).toBe(true);
  });

  it('should promote with high confidence and usage', async () => {
    const medicine = await medicineMasterService.create({
      name: 'High Quality Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      confidenceScore: 95,
    });

    await prisma.pendingMedicine.create({
      data: {
        name: medicine.name,
        compositionText: medicine.compositionText,
        manufacturerName: medicine.manufacturerName,
        form: medicine.form,
        packSize: medicine.packSize,
        requiresPrescription: medicine.requiresPrescription,
        defaultGstRate: medicine.defaultGstRate,
        source: IngestionSource.MANUAL,
        submittedBy: 'test-store',
        confidenceScore: 95,
        usedByStoreCount: 10,
        promotedToCanonicalId: medicine.id,
      },
    });

    const promoted = await ingestionPipelineService.checkPromotionEligibility(medicine.id);
    expect(promoted).toBe(true);
  });
});
