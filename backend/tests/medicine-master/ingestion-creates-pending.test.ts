/**
 * Property Test: Ingestion Creates Pending Entry (Property 16)
 * 
 * Validates: Requirements 4.1
 * 
 * Property: Every ingestion should create a pending medicine entry
 */

import { describe, it, expect } from '@jest/globals';
import { ingestionPipelineService } from '../../src/services/IngestionPipelineService';
import { PrismaClient, IngestionSource } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 16: Ingestion Creates Pending Entry', () => {
  const testStoreId = 'test-store-ingestion';

  const validInput = {
    name: 'Ingestion Test Medicine',
    compositionText: 'Test Salt 100mg',
    manufacturerName: 'Test Pharma',
    form: 'Tablet',
    packSize: '10 tablets',
    requiresPrescription: false,
    defaultGstRate: 12,
    source: IngestionSource.SCAN,
  };

  it('should create pending entry on ingestion', async () => {
    const result = await ingestionPipelineService.ingest(testStoreId, validInput);

    expect(result.canonicalId).toBeDefined();
    expect(result.isNewMedicine).toBe(true);
    expect(result.instantlyAvailable).toBe(true);

    // Verify pending entry exists
    const pending = await prisma.pendingMedicine.findFirst({
      where: { promotedToCanonicalId: result.canonicalId },
    });

    expect(pending).toBeDefined();
    expect(pending?.name).toBe(validInput.name);
  });

  it('should link pending entry to medicine master', async () => {
    const result = await ingestionPipelineService.ingest(testStoreId, {
      ...validInput,
      name: 'Linked Test Medicine',
    });

    const pending = await prisma.pendingMedicine.findFirst({
      where: { promotedToCanonicalId: result.canonicalId },
    });

    expect(pending?.promotedToCanonicalId).toBe(result.canonicalId);
  });

  it('should make medicine instantly available', async () => {
    const result = await ingestionPipelineService.ingest(testStoreId, {
      ...validInput,
      name: 'Instant Available Medicine',
    });

    expect(result.instantlyAvailable).toBe(true);

    // Verify medicine exists in master
    const medicine = await prisma.medicineMaster.findUnique({
      where: { id: result.canonicalId },
    });

    expect(medicine).toBeDefined();
  });

  it('should not create duplicate for existing medicine', async () => {
    // First ingestion
    const result1 = await ingestionPipelineService.ingest(testStoreId, {
      ...validInput,
      name: 'Duplicate Test Medicine',
      primaryBarcode: '9999999999999',
    });

    // Second ingestion with same barcode
    const result2 = await ingestionPipelineService.ingest(testStoreId, {
      ...validInput,
      name: 'Duplicate Test Medicine',
      primaryBarcode: '9999999999999',
    });

    expect(result1.canonicalId).toBe(result2.canonicalId);
    expect(result2.isNewMedicine).toBe(false);
  });

  it('should calculate confidence score', async () => {
    const result = await ingestionPipelineService.ingest(testStoreId, validInput);

    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('should track submission source', async () => {
    const result = await ingestionPipelineService.ingest(testStoreId, {
      ...validInput,
      name: 'Source Tracked Medicine',
      source: IngestionSource.MANUAL,
    });

    const pending = await prisma.pendingMedicine.findFirst({
      where: { promotedToCanonicalId: result.canonicalId },
    });

    expect(pending?.source).toBe(IngestionSource.MANUAL);
  });
});
