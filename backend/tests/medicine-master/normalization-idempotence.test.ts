/**
 * Property Test: Name Normalization Idempotence (Property 21)
 * 
 * Validates: Requirements 5.2
 * 
 * Property: Normalizing an already normalized value should return the same value
 * 
 * Test Strategy:
 * - Normalize various inputs
 * - Normalize the results again
 * - Verify they remain unchanged
 */

import { describe, it, expect } from '@jest/globals';
import { migrationService } from '../../src/services/MigrationService';

describe('Property 21: Name Normalization Idempotence', () => {
  it('should be idempotent for medicine names', () => {
    const inputs = [
      'paracetamol 500mg',
      'ASPIRIN 75MG',
      '  Multiple   Spaces  ',
      'Already Normalized Name',
    ];

    for (const input of inputs) {
      const normalized1 = migrationService.normalizeName(input);
      const normalized2 = migrationService.normalizeName(normalized1);
      
      expect(normalized1).toBe(normalized2);
    }
  });

  it('should be idempotent for strength normalization', () => {
    const inputs = [
      '500mg',
      '500 milligram',
      '75 MG',
      '10mcg',
      '100 microgram',
    ];

    for (const input of inputs) {
      const normalized1 = migrationService.normalizeStrength(input);
      const normalized2 = migrationService.normalizeStrength(normalized1);
      
      expect(normalized1).toBe(normalized2);
    }
  });

  it('should be idempotent for pack size normalization', () => {
    const inputs = [
      '10 tablets',
      '15 capsule',
      '1 bottle',
      '5 strips',
    ];

    for (const input of inputs) {
      const normalized1 = migrationService.normalizePackSize(input);
      const normalized2 = migrationService.normalizePackSize(normalized1);
      
      expect(normalized1).toBe(normalized2);
    }
  });

  it('should handle empty strings idempotently', () => {
    expect(migrationService.normalizeName('')).toBe('');
    expect(migrationService.normalizeStrength('')).toBe('');
    expect(migrationService.normalizePackSize('')).toBe('');
  });

  it('should normalize to consistent format', () => {
    // Different inputs should normalize to same output
    const nameInputs = ['paracetamol', 'PARACETAMOL', '  paracetamol  '];
    const normalized = nameInputs.map((n) => migrationService.normalizeName(n));
    
    expect(normalized[0]).toBe(normalized[1]);
    expect(normalized[1]).toBe(normalized[2]);
  });

  it('should normalize strength units consistently', () => {
    const inputs = ['500 milligram', '500mg', '500 MG'];
    const normalized = inputs.map((s) => migrationService.normalizeStrength(s));
    
    // All should normalize to same format
    expect(normalized[0]).toBe(normalized[1]);
    expect(normalized[1]).toBe(normalized[2]);
  });

  it('should normalize pack size plurals consistently', () => {
    const singular = migrationService.normalizePackSize('10 tablet');
    const plural = migrationService.normalizePackSize('10 tablets');
    
    expect(singular).toBe(plural);
  });
});
