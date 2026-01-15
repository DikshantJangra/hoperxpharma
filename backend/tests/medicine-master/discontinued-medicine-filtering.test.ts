/**
 * Property Test: Discontinued Medicine Filtering (Property 14)
 * 
 * Validates: Requirements 3.5
 * 
 * Property: Discontinued medicines should be excluded from search results by default
 * 
 * Test Strategy:
 * - Given medicines with different statuses (VERIFIED, DISCONTINUED)
 * - When searching without explicit discontinued filter
 * - Then only non-discontinued medicines should appear
 * - When explicitly including discontinued medicines
 * - Then discontinued medicines should appear
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { searchService } from '../../src/services/SearchService';
import { indexManagementService } from '../../src/services/IndexManagementService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 14: Discontinued Medicine Filtering', () => {
  const testMedicines = [
    {
      id: 'test-discontinued-active-1',
      name: 'Active Medicine A',
      genericName: 'Active A',
      compositionText: 'Active Ingredient A 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      status: 'VERIFIED',
      defaultGstRate: 12,
      usageCount: 100,
      confidenceScore: 95,
    },
    {
      id: 'test-discontinued-discontinued-1',
      name: 'Discontinued Medicine B',
      genericName: 'Discontinued B',
      compositionText: 'Discontinued Ingredient B 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      status: 'DISCONTINUED',
      defaultGstRate: 12,
      usageCount: 50,
      confidenceScore: 95,
    },
    {
      id: 'test-discontinued-pending-1',
      name: 'Pending Medicine C',
      genericName: 'Pending C',
      compositionText: 'Pending Ingredient C 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      status: 'PENDING_REVIEW',
      defaultGstRate: 12,
      usageCount: 10,
      confidenceScore: 70,
    },
  ];

  beforeAll(async () => {
    // Create test medicines
    for (const medicine of testMedicines) {
      await prisma.medicineMaster.upsert({
        where: { id: medicine.id },
        create: medicine,
        update: medicine,
      });
      await indexManagementService.indexMedicine(medicine.id);
    }

    // Wait for indexing
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('should exclude discontinued medicines by default', async () => {
    const results = await searchService.search({
      query: 'Medicine',
      limit: 10,
    });

    // Should not contain discontinued medicine
    const hasDiscontinued = results.some(
      (r) => r.status === 'DISCONTINUED'
    );
    expect(hasDiscontinued).toBe(false);

    // Should contain active medicine
    const hasActive = results.some(
      (r) => r.canonicalId === 'test-discontinued-active-1'
    );
    expect(hasActive).toBe(true);
  });

  it('should exclude discontinued when filter is explicitly false', async () => {
    const results = await searchService.search({
      query: 'Medicine',
      filters: { discontinued: false },
      limit: 10,
    });

    const hasDiscontinued = results.some(
      (r) => r.status === 'DISCONTINUED'
    );
    expect(hasDiscontinued).toBe(false);
  });

  it('should include discontinued when filter is explicitly true', async () => {
    const results = await searchService.search({
      query: 'Discontinued Medicine B',
      filters: { discontinued: true },
      limit: 10,
    });

    // Should find the discontinued medicine
    const found = results.some(
      (r) => r.canonicalId === 'test-discontinued-discontinued-1'
    );
    expect(found).toBe(true);
  });

  it('should exclude discontinued in autocomplete by default', async () => {
    const result = await searchService.autocomplete('Medicine');

    const hasDiscontinued = result.suggestions.some(
      (s) => s.status === 'DISCONTINUED'
    );
    expect(hasDiscontinued).toBe(false);
  });

  it('should exclude discontinued in composition search by default', async () => {
    const results = await searchService.searchByComposition('Ingredient');

    const hasDiscontinued = results.some(
      (r) => r.status === 'DISCONTINUED'
    );
    expect(hasDiscontinued).toBe(false);
  });

  it('should include non-discontinued statuses (PENDING, VERIFIED)', async () => {
    const results = await searchService.search({
      query: 'Medicine',
      limit: 10,
    });

    // Should include VERIFIED
    const hasVerified = results.some(
      (r) => r.status === 'VERIFIED'
    );
    expect(hasVerified).toBe(true);

    // Should include PENDING_REVIEW
    const hasPending = results.some(
      (r) => r.status === 'PENDING_REVIEW'
    );
    expect(hasPending).toBe(true);
  });

  it('should maintain filtering with other filters combined', async () => {
    const results = await searchService.search({
      query: 'Medicine',
      filters: {
        discontinued: false,
        requiresPrescription: false,
      },
      limit: 10,
    });

    // Should not have discontinued
    const hasDiscontinued = results.some(
      (r) => r.status === 'DISCONTINUED'
    );
    expect(hasDiscontinued).toBe(false);

    // Should not have prescription-required
    const hasPrescription = results.some(
      (r) => r.requiresPrescription === true
    );
    expect(hasPrescription).toBe(false);
  });

  it('should preserve discontinued medicine data for historical queries', async () => {
    // Even though excluded from search, the medicine should exist in DB
    const medicine = await prisma.medicineMaster.findUnique({
      where: { id: 'test-discontinued-discontinued-1' },
    });

    expect(medicine).not.toBeNull();
    expect(medicine?.status).toBe('DISCONTINUED');
  });
});
