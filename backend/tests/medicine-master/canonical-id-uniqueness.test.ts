/**
 * Property Test: Canonical ID Uniqueness
 * Feature: universal-medicine-master, Property 2: Canonical ID Uniqueness
 * Validates: Requirements 1.2
 * 
 * Property: For any two medicines created in the Medicine_Master, their canonical_ids SHALL be different.
 */

import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Property 2: Canonical ID Uniqueness', () => {
  it('should generate unique canonical IDs for all created medicines', async () => {
    // Property: For any two medicines, their canonical IDs must be different
    
    const medicines = await Promise.all([
      prisma.medicineMaster.create({
        data: {
          name: 'Test Medicine 1',
          compositionText: 'Paracetamol 500mg',
          form: 'Tablet',
          packSize: 'Strip of 10',
          manufacturerName: 'Test Pharma',
        },
      }),
      prisma.medicineMaster.create({
        data: {
          name: 'Test Medicine 2',
          compositionText: 'Ibuprofen 400mg',
          form: 'Tablet',
          packSize: 'Strip of 10',
          manufacturerName: 'Test Pharma',
        },
      }),
      prisma.medicineMaster.create({
        data: {
          name: 'Test Medicine 3',
          compositionText: 'Amoxicillin 250mg',
          form: 'Capsule',
          packSize: 'Strip of 10',
          manufacturerName: 'Test Pharma',
        },
      }),
    ]);

    // Extract all canonical IDs
    const canonicalIds = medicines.map(m => m.id);

    // Verify all IDs are unique
    const uniqueIds = new Set(canonicalIds);
    expect(uniqueIds.size).toBe(canonicalIds.length);

    // Verify no two IDs are the same
    for (let i = 0; i < canonicalIds.length; i++) {
      for (let j = i + 1; j < canonicalIds.length; j++) {
        expect(canonicalIds[i]).not.toBe(canonicalIds[j]);
      }
    }

    // Cleanup
    await prisma.medicineMaster.deleteMany({
      where: {
        id: {
          in: canonicalIds,
        },
      },
    });
  }, { timeout: 10000 });
});
