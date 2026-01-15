/**
 * Property Test: ID Mapping Round-Trip (Property 23)
 * 
 * Validates: Requirements 5.4, 5.5
 * 
 * Property: Creating an ID mapping and looking it up should return the original canonical ID
 * 
 * Test Strategy:
 * - Create ID mappings
 * - Lookup by old ID
 * - Verify canonical ID matches
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { migrationService } from '../../src/services/MigrationService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 23: ID Mapping Round-Trip', () => {
  let canonicalId: string;

  beforeAll(async () => {
    const medicine = await medicineMasterService.create({
      name: 'ID Mapping Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    canonicalId = medicine.id;
  });

  it('should complete round-trip for single mapping', async () => {
    const oldId = 'old-medicine-id-123';

    // Create mapping
    await migrationService.createIdMapping(oldId, canonicalId);

    // Lookup
    const result = await migrationService.lookupByOldId(oldId);

    expect(result).toBe(canonicalId);
  });

  it('should complete round-trip for multiple mappings', async () => {
    const mappings = [
      { oldId: 'old-id-1', newId: canonicalId },
      { oldId: 'old-id-2', newId: canonicalId },
      { oldId: 'old-id-3', newId: canonicalId },
    ];

    for (const mapping of mappings) {
      await migrationService.createIdMapping(mapping.oldId, mapping.newId);
    }

    for (const mapping of mappings) {
      const result = await migrationService.lookupByOldId(mapping.oldId);
      expect(result).toBe(mapping.newId);
    }
  });

  it('should return null for non-existent old ID', async () => {
    const result = await migrationService.lookupByOldId('non-existent-old-id');
    expect(result).toBeNull();
  });

  it('should update mapping if old ID already exists', async () => {
    const oldId = 'updateable-old-id';
    const firstCanonicalId = canonicalId;

    // Create another medicine
    const medicine2 = await medicineMasterService.create({
      name: 'Second Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    });
    const secondCanonicalId = medicine2.id;

    // Create initial mapping
    await migrationService.createIdMapping(oldId, firstCanonicalId);
    let result = await migrationService.lookupByOldId(oldId);
    expect(result).toBe(firstCanonicalId);

    // Update mapping
    await migrationService.createIdMapping(oldId, secondCanonicalId);
    result = await migrationService.lookupByOldId(oldId);
    expect(result).toBe(secondCanonicalId);
  });

  it('should handle multiple old IDs mapping to same canonical ID', async () => {
    const oldIds = ['legacy-id-1', 'legacy-id-2', 'legacy-id-3'];

    for (const oldId of oldIds) {
      await migrationService.createIdMapping(oldId, canonicalId);
    }

    for (const oldId of oldIds) {
      const result = await migrationService.lookupByOldId(oldId);
      expect(result).toBe(canonicalId);
    }
  });

  it('should preserve mapping after multiple lookups', async () => {
    const oldId = 'persistent-old-id';
    await migrationService.createIdMapping(oldId, canonicalId);

    // Multiple lookups
    const result1 = await migrationService.lookupByOldId(oldId);
    const result2 = await migrationService.lookupByOldId(oldId);
    const result3 = await migrationService.lookupByOldId(oldId);

    expect(result1).toBe(canonicalId);
    expect(result2).toBe(canonicalId);
    expect(result3).toBe(canonicalId);
  });

  it('should handle special characters in old IDs', async () => {
    const specialIds = [
      'old-id-with-dashes',
      'old_id_with_underscores',
      'old.id.with.dots',
      'old:id:with:colons',
    ];

    for (const oldId of specialIds) {
      await migrationService.createIdMapping(oldId, canonicalId);
      const result = await migrationService.lookupByOldId(oldId);
      expect(result).toBe(canonicalId);
    }
  });

  it('should be case-sensitive for old IDs', async () => {
    const lowerCaseId = 'lowercase-id';
    const upperCaseId = 'LOWERCASE-ID';

    await migrationService.createIdMapping(lowerCaseId, canonicalId);

    const lowerResult = await migrationService.lookupByOldId(lowerCaseId);
    const upperResult = await migrationService.lookupByOldId(upperCaseId);

    expect(lowerResult).toBe(canonicalId);
    expect(upperResult).toBeNull(); // Different case = different ID
  });
});
