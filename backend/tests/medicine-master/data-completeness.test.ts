/**
 * Property Test: Medicine Master Data Completeness (Property 1)
 * 
 * Validates: Requirements 1.1
 * 
 * Property: All required fields must be present and non-empty for a medicine to be created
 * 
 * Test Strategy:
 * - Attempt to create medicines with missing required fields
 * - Verify that creation fails with appropriate errors
 * - Verify that complete data succeeds
 */

import { describe, it, expect } from '@jest/globals';
import { medicineMasterService } from '../../src/services/MedicineMasterService';

describe('Property 1: Medicine Master Data Completeness', () => {
  const validInput = {
    name: 'Test Medicine',
    compositionText: 'Test Composition 100mg',
    manufacturerName: 'Test Manufacturer',
    form: 'Tablet',
    packSize: '10 tablets',
    requiresPrescription: false,
    defaultGstRate: 12,
  };

  it('should create medicine with all required fields', async () => {
    const medicine = await medicineMasterService.create(validInput);
    
    expect(medicine).toBeDefined();
    expect(medicine.name).toBe(validInput.name);
    expect(medicine.compositionText).toBe(validInput.compositionText);
    expect(medicine.manufacturerName).toBe(validInput.manufacturerName);
    expect(medicine.form).toBe(validInput.form);
    expect(medicine.packSize).toBe(validInput.packSize);
    expect(medicine.requiresPrescription).toBe(validInput.requiresPrescription);
    expect(medicine.defaultGstRate).toBe(validInput.defaultGstRate);
  });

  it('should fail when name is missing', async () => {
    const input = { ...validInput, name: '' };
    
    await expect(medicineMasterService.create(input as any)).rejects.toThrow();
  });

  it('should fail when compositionText is missing', async () => {
    const input = { ...validInput, compositionText: '' };
    
    await expect(medicineMasterService.create(input as any)).rejects.toThrow();
  });

  it('should fail when manufacturerName is missing', async () => {
    const input = { ...validInput, manufacturerName: '' };
    
    await expect(medicineMasterService.create(input as any)).rejects.toThrow();
  });

  it('should fail when form is missing', async () => {
    const input = { ...validInput, form: '' };
    
    await expect(medicineMasterService.create(input as any)).rejects.toThrow();
  });

  it('should fail when packSize is missing', async () => {
    const input = { ...validInput, packSize: '' };
    
    await expect(medicineMasterService.create(input as any)).rejects.toThrow();
  });

  it('should allow optional fields to be undefined', async () => {
    const input = {
      ...validInput,
      genericName: undefined,
      schedule: undefined,
      hsnCode: undefined,
      primaryBarcode: undefined,
    };
    
    const medicine = await medicineMasterService.create(input);
    expect(medicine).toBeDefined();
  });

  it('should generate canonical ID automatically', async () => {
    const medicine = await medicineMasterService.create(validInput);
    
    expect(medicine.id).toBeDefined();
    expect(medicine.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('should set default values for optional fields', async () => {
    const medicine = await medicineMasterService.create(validInput);
    
    expect(medicine.status).toBeDefined();
    expect(medicine.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(medicine.usageCount).toBe(0);
  });
});
