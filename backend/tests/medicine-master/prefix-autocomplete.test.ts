/**
 * Property Test: Prefix Autocomplete (Property 12)
 * 
 * Validates: Requirements 3.3
 * 
 * Property: Autocomplete should return results for any prefix >= 2 characters
 * 
 * Test Strategy:
 * - Given medicines with known names
 * - When searching with prefixes of varying lengths
 * - Then results should match the prefix and be ranked by relevance
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { searchService } from '../../src/services/SearchService';
import { indexManagementService } from '../../src/services/IndexManagementService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 12: Prefix Autocomplete', () => {
  const testMedicines = [
    {
      id: 'test-autocomplete-aspirin-75',
      name: 'Aspirin 75mg Tablet',
      genericName: 'Aspirin',
      compositionText: 'Aspirin 75mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      status: 'VERIFIED',
      defaultGstRate: 12,
      usageCount: 200,
      confidenceScore: 95,
    },
    {
      id: 'test-autocomplete-aspirin-150',
      name: 'Aspirin 150mg Tablet',
      genericName: 'Aspirin',
      compositionText: 'Aspirin 150mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      status: 'VERIFIED',
      defaultGstRate: 12,
      usageCount: 150,
      confidenceScore: 95,
    },
    {
      id: 'test-autocomplete-atorvastatin',
      name: 'Atorvastatin 10mg Tablet',
      genericName: 'Atorvastatin',
      compositionText: 'Atorvastatin 10mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: true,
      status: 'VERIFIED',
      defaultGstRate: 12,
      usageCount: 100,
      confidenceScore: 95,
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

  it('should return empty results for prefix < 2 characters', async () => {
    const result = await searchService.autocomplete('A');
    expect(result.suggestions).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('should return results for 2-character prefix', async () => {
    const result = await searchService.autocomplete('As');
    expect(result.suggestions.length).toBeGreaterThan(0);
    
    // All results should start with "As"
    const allMatch = result.suggestions.every((s) =>
      s.name.toLowerCase().startsWith('as')
    );
    expect(allMatch).toBe(true);
  });

  it('should return results for 3-character prefix', async () => {
    const result = await searchService.autocomplete('Asp');
    expect(result.suggestions.length).toBeGreaterThan(0);
    
    // Should find both Aspirin medicines
    const aspirinCount = result.suggestions.filter((s) =>
      s.name.toLowerCase().includes('aspirin')
    ).length;
    expect(aspirinCount).toBeGreaterThanOrEqual(2);
  });

  it('should narrow results as prefix gets longer', async () => {
    const result2 = await searchService.autocomplete('As');
    const result4 = await searchService.autocomplete('Aspi');
    const result6 = await searchService.autocomplete('Aspiri');

    // Results should narrow or stay same (never increase)
    expect(result4.count).toBeLessThanOrEqual(result2.count);
    expect(result6.count).toBeLessThanOrEqual(result4.count);
  });

  it('should rank by usage count (higher usage first)', async () => {
    const result = await searchService.autocomplete('Asp', { limit: 10 });
    
    if (result.suggestions.length >= 2) {
      // First result should have higher or equal usage count
      const firstUsage = result.suggestions[0].usageCount;
      const secondUsage = result.suggestions[1].usageCount;
      expect(firstUsage).toBeGreaterThanOrEqual(secondUsage);
    }
  });

  it('should respect limit parameter', async () => {
    const result = await searchService.autocomplete('As', { limit: 1 });
    expect(result.suggestions.length).toBeLessThanOrEqual(1);
  });

  it('should filter by requiresPrescription when specified', async () => {
    const result = await searchService.autocomplete('At', {
      filters: { requiresPrescription: true },
    });

    // All results should require prescription
    const allRequirePrescription = result.suggestions.every(
      (s) => s.requiresPrescription === true
    );
    expect(allRequirePrescription).toBe(true);
  });

  it('should return results in order of relevance', async () => {
    const result = await searchService.autocomplete('Asp');
    
    // Results should have scores
    expect(result.suggestions.every((s) => s.score !== undefined)).toBe(true);
    
    // Scores should be in descending order
    for (let i = 0; i < result.suggestions.length - 1; i++) {
      expect(result.suggestions[i].score).toBeGreaterThanOrEqual(
        result.suggestions[i + 1].score
      );
    }
  });
});
