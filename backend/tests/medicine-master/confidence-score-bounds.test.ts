/**
 * Property Test: Confidence Score Bounds (Property 18)
 * 
 * Validates: Requirements 4.5
 * 
 * Property: Confidence score must always be between 0 and 100
 */

import { describe, it, expect } from '@jest/globals';
import { ingestionPipelineService } from '../../src/services/IngestionPipelineService';
import { IngestionSource } from '@prisma/client';

describe('Property 18: Confidence Score Bounds', () => {
  it('should return score between 0 and 100 for minimal data', () => {
    const minimalInput = {
      name: 'Min',
      compositionText: 'Min',
      manufacturerName: 'M',
      form: 'T',
      packSize: '1',
      requiresPrescription: false,
      defaultGstRate: 12,
      source: IngestionSource.MANUAL,
    };

    const score = ingestionPipelineService.calculateConfidenceScore(minimalInput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return score between 0 and 100 for complete data', () => {
    const completeInput = {
      name: 'Complete Medicine Name',
      genericName: 'Generic Name',
      compositionText: 'Complete Composition Text',
      manufacturerName: 'Complete Manufacturer',
      form: 'Tablet',
      packSize: '10 tablets',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 12,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
      source: IngestionSource.SCAN,
    };

    const score = ingestionPipelineService.calculateConfidenceScore(completeInput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give higher score for more complete data', () => {
    const minimalInput = {
      name: 'Min',
      compositionText: 'Min',
      manufacturerName: 'M',
      form: 'T',
      packSize: '1',
      requiresPrescription: false,
      defaultGstRate: 12,
      source: IngestionSource.MANUAL,
    };

    const completeInput = {
      ...minimalInput,
      name: 'Complete Medicine Name',
      genericName: 'Generic Name',
      compositionText: 'Complete Composition Text',
      manufacturerName: 'Complete Manufacturer',
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
    };

    const minScore = ingestionPipelineService.calculateConfidenceScore(minimalInput);
    const maxScore = ingestionPipelineService.calculateConfidenceScore(completeInput);

    expect(maxScore).toBeGreaterThan(minScore);
  });

  it('should cap score at 100', () => {
    const input = {
      name: 'Very Complete Medicine Name With All Details',
      genericName: 'Generic Name',
      compositionText: 'Very Complete Composition Text',
      manufacturerName: 'Complete Manufacturer Name',
      form: 'Tablet',
      packSize: '10 tablets',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 12,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
      source: IngestionSource.SCAN,
    };

    const score = ingestionPipelineService.calculateConfidenceScore(input);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle missing optional fields gracefully', () => {
    const input = {
      name: 'Medicine Name',
      compositionText: 'Composition',
      manufacturerName: 'Manufacturer',
      form: 'Tablet',
      packSize: '10',
      requiresPrescription: false,
      defaultGstRate: 12,
      source: IngestionSource.MANUAL,
      // Missing: genericName, schedule, hsnCode, primaryBarcode
    };

    const score = ingestionPipelineService.calculateConfidenceScore(input);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should be deterministic for same input', () => {
    const input = {
      name: 'Test Medicine',
      compositionText: 'Test Composition',
      manufacturerName: 'Test Manufacturer',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      source: IngestionSource.MANUAL,
    };

    const score1 = ingestionPipelineService.calculateConfidenceScore(input);
    const score2 = ingestionPipelineService.calculateConfidenceScore(input);
    const score3 = ingestionPipelineService.calculateConfidenceScore(input);

    expect(score1).toBe(score2);
    expect(score2).toBe(score3);
  });
});
