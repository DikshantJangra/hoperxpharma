/**
 * Property Test: Incomplete Data Flagging (Property 30)
 * 
 * Validates: Requirements 8.5
 * 
 * Property: Medicines with missing required fields should be flagged as incomplete
 */

import { describe, it, expect } from '@jest/globals';
import { dataGovernanceService } from '../../src/services/DataGovernanceService';

describe('Property 30: Incomplete Data Flagging', () => {
  it('should flag medicine with missing composition', () => {
    const medicine = {
      id: 'test-1',
      name: 'Test Medicine',
      compositionText: '', // Missing
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    expect(report.isComplete).toBe(false);
    expect(report.issues.some(i => i.field === 'compositionText')).toBe(true);
    expect(report.completenessScore).toBeLessThan(100);
  });

  it('should flag medicine with missing manufacturer', () => {
    const medicine = {
      id: 'test-2',
      name: 'Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: '', // Missing
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    expect(report.isComplete).toBe(false);
    expect(report.issues.some(i => i.field === 'manufacturerName')).toBe(true);
  });

  it('should flag medicine with missing HSN code as warning', () => {
    const medicine = {
      id: 'test-3',
      name: 'Test Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      hsnCode: null, // Missing
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    const hsnIssue = report.issues.find(i => i.field === 'hsnCode');
    expect(hsnIssue).toBeDefined();
    expect(hsnIssue?.severity).toBe('WARNING');
  });

  it('should not flag complete medicine', () => {
    const medicine = {
      id: 'test-4',
      name: 'Complete Medicine',
      genericName: 'Generic Name',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      schedule: 'H',
      requiresPrescription: true,
      defaultGstRate: 12,
      hsnCode: '30049099',
      primaryBarcode: '1234567890123',
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    expect(report.isComplete).toBe(true);
    expect(report.issues.filter(i => i.severity === 'ERROR')).toHaveLength(0);
    expect(report.completenessScore).toBe(100);
  });

  it('should calculate completeness score correctly', () => {
    const incompleteMedicine = {
      id: 'test-5',
      name: 'Incomplete Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      // Missing: genericName, hsnCode, primaryBarcode
    };

    const report = dataGovernanceService.flagIncompleteData(incompleteMedicine);

    expect(report.completenessScore).toBeGreaterThan(0);
    expect(report.completenessScore).toBeLessThan(100);
  });

  it('should flag missing schedule for prescription medicines', () => {
    const medicine = {
      id: 'test-6',
      name: 'Prescription Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: true,
      schedule: null, // Missing for prescription medicine
      defaultGstRate: 12,
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    const scheduleIssue = report.issues.find(i => i.field === 'schedule');
    expect(scheduleIssue).toBeDefined();
  });

  it('should not flag missing schedule for non-prescription medicines', () => {
    const medicine = {
      id: 'test-7',
      name: 'Non-Prescription Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      schedule: null,
      defaultGstRate: 12,
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    const scheduleIssue = report.issues.find(i => i.field === 'schedule');
    expect(scheduleIssue).toBeUndefined();
  });

  it('should distinguish between ERROR and WARNING severity', () => {
    const medicine = {
      id: 'test-8',
      name: 'Test Medicine',
      compositionText: '', // ERROR
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      hsnCode: null, // WARNING
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    const errors = report.issues.filter(i => i.severity === 'ERROR');
    const warnings = report.issues.filter(i => i.severity === 'WARNING');

    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should provide descriptive issue messages', () => {
    const medicine = {
      id: 'test-9',
      name: '',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
    };

    const report = dataGovernanceService.flagIncompleteData(medicine);

    const nameIssue = report.issues.find(i => i.field === 'name');
    expect(nameIssue?.issue).toBeDefined();
    expect(nameIssue?.issue.length).toBeGreaterThan(10); // Descriptive
  });
});
