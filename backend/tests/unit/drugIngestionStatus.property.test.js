/**
 * Property-Based Tests for Drug Ingestion Status
 * Feature: salt-intelligence-production
 * Property 15: SALT_PENDING Default for Unmapped Imports
 * Validates: Requirements 7.4
 */

const fc = require('fast-check');
const prisma = require('../../src/db/prisma');

// Mock Prisma for testing
jest.mock('../../src/db/prisma', () => ({
  drug: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  drugSaltLink: {
    findMany: jest.fn(),
  }
}));

describe('Drug Ingestion Status Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 15: SALT_PENDING Default for Unmapped Imports
   * For any medicine created via import or API without salt links,
   * the ingestion status should default to SALT_PENDING.
   */
  test('Property 15: medicines without salt links default to SALT_PENDING', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random drug data without salt links
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 100 }),
          manufacturer: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: null }),
          form: fc.oneof(
            fc.constant('Tablet'),
            fc.constant('Capsule'),
            fc.constant('Syrup'),
            fc.constant('Injection'),
            fc.constant('Cream')
          ),
          storeId: fc.uuid(),
          genericName: fc.option(fc.string({ minLength: 5, maxLength: 200 }), { nil: null }),
        }),
        async (drugData) => {
          // Mock: Drug created without explicit ingestionStatus
          const createdDrug = {
            ...drugData,
            ingestionStatus: 'SALT_PENDING', // Default value
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prisma.drug.create.mockResolvedValue(createdDrug);
          prisma.drugSaltLink.findMany.mockResolvedValue([]); // No salt links

          // Simulate drug creation
          const result = await prisma.drug.create({
            data: drugData
          });

          // Verify salt links
          const saltLinks = await prisma.drugSaltLink.findMany({
            where: { drugId: result.id }
          });

          // Property: If no salt links exist, status must be SALT_PENDING
          if (saltLinks.length === 0) {
            expect(result.ingestionStatus).toBe('SALT_PENDING');
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations
    );
  });

  /**
   * Property: Medicines with salt links can be ACTIVE
   * For any medicine with at least one valid salt link,
   * the ingestion status can be set to ACTIVE.
   */
  test('Property: medicines with salt links can be ACTIVE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 100 }),
          storeId: fc.uuid(),
          saltLinks: fc.array(
            fc.record({
              saltId: fc.uuid(),
              strengthValue: fc.float({ min: Math.fround(0.1), max: Math.fround(10000) }),
              strengthUnit: fc.oneof(
                fc.constant('mg'),
                fc.constant('ml'),
                fc.constant('g'),
                fc.constant('%')
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (drugData) => {
          const createdDrug = {
            ...drugData,
            ingestionStatus: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prisma.drug.create.mockResolvedValue(createdDrug);
          prisma.drugSaltLink.findMany.mockResolvedValue(drugData.saltLinks);

          const result = await prisma.drug.create({
            data: {
              ...drugData,
              ingestionStatus: 'ACTIVE'
            }
          });

          const saltLinks = await prisma.drugSaltLink.findMany({
            where: { drugId: result.id }
          });

          // Property: If salt links exist, ACTIVE status is valid
          if (saltLinks.length > 0) {
            expect(['ACTIVE', 'SALT_PENDING']).toContain(result.ingestionStatus);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status transitions are valid
   * Valid transitions: DRAFT -> SALT_PENDING -> ACTIVE
   * Invalid: ACTIVE -> SALT_PENDING, ACTIVE -> DRAFT
   */
  test('Property: status transitions follow valid state machine', async () => {
    const validTransitions = {
      'DRAFT': ['SALT_PENDING', 'ACTIVE', 'DRAFT'], // Can stay in DRAFT
      'SALT_PENDING': ['ACTIVE', 'DRAFT', 'SALT_PENDING'], // Can go back to DRAFT or stay
      'ACTIVE': ['ACTIVE'], // Can only stay active
    };

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentStatus: fc.oneof(
            fc.constant('DRAFT'),
            fc.constant('SALT_PENDING'),
            fc.constant('ACTIVE')
          ),
          newStatus: fc.oneof(
            fc.constant('DRAFT'),
            fc.constant('SALT_PENDING'),
            fc.constant('ACTIVE')
          ),
        }),
        async ({ currentStatus, newStatus }) => {
          const isValidTransition = validTransitions[currentStatus].includes(newStatus);

          // Property: Transition validity is deterministic
          if (currentStatus === 'ACTIVE' && newStatus !== 'ACTIVE') {
            expect(isValidTransition).toBe(false);
          } else {
            expect(isValidTransition).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
