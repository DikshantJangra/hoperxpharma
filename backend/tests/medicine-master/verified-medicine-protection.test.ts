/**
 * Property Test: Verified Medicine Protection (Property 28)
 * 
 * Validates: Requirements 8.3
 * 
 * Property: Verified medicines should only be updatable by authorized users
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { dataGovernanceService } from '../../src/services/DataGovernanceService';
import { medicineMasterService } from '../../src/services/MedicineMasterService';
import { MedicineStatus } from '@prisma/client';

describe('Property 28: Verified Medicine Protection', () => {
  let verifiedMedicineId: string;
  let pendingMedicineId: string;

  beforeAll(async () => {
    // Create verified medicine
    const verified = await medicineMasterService.create({
      name: 'Verified Medicine',
      compositionText: 'Test Salt 100mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      status: MedicineStatus.VERIFIED,
    });
    verifiedMedicineId = verified.id;

    // Create pending medicine
    const pending = await medicineMasterService.create({
      name: 'Pending Medicine',
      compositionText: 'Test Salt 50mg',
      manufacturerName: 'Test Pharma',
      form: 'Tablet',
      packSize: '10 tablets',
      requiresPrescription: false,
      defaultGstRate: 12,
      status: MedicineStatus.PENDING_REVIEW,
    });
    pendingMedicineId = pending.id;
  });

  it('should allow admin to update verified medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      verifiedMedicineId,
      'admin-user',
      'ADMIN'
    );

    expect(canUpdate).toBe(true);
  });

  it('should allow system to update verified medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      verifiedMedicineId,
      'system',
      'SYSTEM'
    );

    expect(canUpdate).toBe(true);
  });

  it('should block regular user from updating verified medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      verifiedMedicineId,
      'regular-user',
      'USER'
    );

    expect(canUpdate).toBe(false);
  });

  it('should allow anyone to update non-verified medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      pendingMedicineId,
      'regular-user',
      'USER'
    );

    expect(canUpdate).toBe(true);
  });

  it('should protect verified medicine with protection check', async () => {
    const result = await dataGovernanceService.protectVerifiedMedicine(
      verifiedMedicineId,
      { confidenceScore: 100 },
      'regular-user',
      'USER'
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('should allow update with proper authorization', async () => {
    const result = await dataGovernanceService.protectVerifiedMedicine(
      verifiedMedicineId,
      { confidenceScore: 100 },
      'admin-user',
      'ADMIN'
    );

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should allow super admin to update verified medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      verifiedMedicineId,
      'super-admin',
      'SUPER_ADMIN'
    );

    expect(canUpdate).toBe(true);
  });

  it('should handle system user ID specially', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      verifiedMedicineId,
      'system',
      undefined // No role
    );

    expect(canUpdate).toBe(true);
  });

  it('should return false for non-existent medicine', async () => {
    const canUpdate = await dataGovernanceService.canUpdateVerifiedMedicine(
      'non-existent-id',
      'admin-user',
      'ADMIN'
    );

    expect(canUpdate).toBe(false);
  });
});
