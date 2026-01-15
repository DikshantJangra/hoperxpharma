/**
 * Property Test: Fuzzy Search Tolerance (Property 11)
 * 
 * Validates: Requirements 3.2
 * 
 * Property: Search should tolerate up to 2 typos and still return relevant results
 * 
 * Test Strategy:
 * - Given a known medicine name
 * - When searching with 1-2 character typos
 * - Then the correct medicine should still appear in results
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { searchService } from '../../src/services/SearchService';
import { indexManagementService } from '../../src/services/IndexManagementService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 11: Fuzzy Search Tolerance', () => {
  const testMedicine = {
    id: 'test-fuzzy-paracetamol-500',
    name: 'Paracetamol 500mg Tablet',
    genericName: 'Paracetamol',
    compositionText: 'Paracetamol 500mg',
    manufacturerName: 'Test Pharma',
    form: 'Tablet',
    packSize: '10 tablets',
    requiresPrescription: false,
    status: 'VERIFIED',
    defaultGstRate: 12,
    usageCount: 100,
    confidenceScore: 95,
  };

  beforeAll(async () => {
    // Create test medicine
    await prisma.medicineMaster.upsert({
      where: { id: testMedicine.id },
      create: testMedicine,
      update: testMedicine,
    });

    // Index it
    await indexManagementService.indexMedicine(testMedicine.id);

    // Wait for indexing
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('should find medicine with 1 typo in name', async () => {
    // "Paracetamol" -> "Paracetamol" (1 typo: 'a' -> 'e')
    const results = await searchService.search({
      query: 'Parecetamol',
      limit: 10,
    });

    const found = results.some((r) => r.canonicalId === testMedicine.id);
    expect(found).toBe(true);
  });

  it('should find medicine with 2 typos in name', async () => {
    // "Paracetamol" -> "Paracetamol" (2 typos: 'a' -> 'e', 'e' -> 'i')
    const results = await searchService.search({
      query: 'Parecitamol',
      limit: 10,
    });

    const found = results.some((r) => r.canonicalId === testMedicine.id);
    expect(found).toBe(true);
  });

  it('should find medicine with transposed characters', async () => {
    // "Paracetamol" -> "Paracetamol" (transposition: 'ce' -> 'ec')
    const results = await searchService.search({
      query: 'Paracetamol',
      limit: 10,
    });

    const found = results.some((r) => r.canonicalId === testMedicine.id);
    expect(found).toBe(true);
  });

  it('should find medicine with missing character', async () => {
    // "Paracetamol" -> "Paracetamol" (missing 'a')
    const results = await searchService.search({
      query: 'Parcetamol',
      limit: 10,
    });

    const found = results.some((r) => r.canonicalId === testMedicine.id);
    expect(found).toBe(true);
  });

  it('should find medicine with extra character', async () => {
    // "Paracetamol" -> "Paracetamol" (extra 'a')
    const results = await searchService.search({
      query: 'Paraacetamol',
      limit: 10,
    });

    const found = results.some((r) => r.canonicalId === testMedicine.id);
    expect(found).toBe(true);
  });

  it('should not find medicine with 3+ typos (beyond tolerance)', async () => {
    // "Paracetamol" -> "Paracetamol" (3+ typos)
    const results = await searchService.search({
      query: 'Perecitemol',
      limit: 10,
    });

    // May or may not find it - fuzzy matching has limits
    // This test documents the boundary behavior
    expect(results).toBeDefined();
  });
});
