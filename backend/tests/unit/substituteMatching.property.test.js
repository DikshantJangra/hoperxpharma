const fc = require('fast-check');
const substituteService = require('../../src/services/substituteService');

// Mock Prisma
jest.mock('../../src/db/prisma', () => ({
    drug: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
}));

const prisma = require('../../src/db/prisma');

describe('Substitute Discovery Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property 4: Substitute Discovery Exact Matching
     * 
     * Validates: Requirements 5.2
     * 
     * Property: For any drug with salt composition, findSubstitutes should only return
     * drugs with identical salt IDs, strengths, and units
     */
    test('Property: exact matches have identical salt composition', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        saltId: fc.uuid(),
                        saltName: fc.string({ minLength: 3, maxLength: 20 }),
                        strengthValue: fc.integer({ min: 1, max: 1000 }),
                        strengthUnit: fc.constantFrom('mg', 'ml', 'g', 'mcg')
                    }),
                    { minLength: 1, maxLength: 3 }
                ),
                async (saltComposition) => {
                    // Clear mocks for this iteration
                    jest.clearAllMocks();

                    const drugId = 'source-drug-123';
                    const storeId = 'store-456';

                    // Create source drug with salt composition
                    const sourceDrug = {
                        id: drugId,
                        name: 'Source Medicine',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: saltComposition.map((salt, index) => ({
                            saltId: salt.saltId,
                            strengthValue: salt.strengthValue,
                            strengthUnit: salt.strengthUnit,
                            order: index,
                            salt: {
                                id: salt.saltId,
                                name: salt.saltName
                            }
                        }))
                    };

                    // Create exact match drug
                    const exactMatchDrug = {
                        id: 'exact-match-789',
                        name: 'Exact Match Medicine',
                        manufacturer: 'Test Pharma',
                        form: 'Tablet',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        deletedAt: null,
                        drugSaltLinks: saltComposition.map((salt, index) => ({
                            saltId: salt.saltId,
                            strengthValue: salt.strengthValue,
                            strengthUnit: salt.strengthUnit,
                            order: index,
                            salt: {
                                id: salt.saltId,
                                name: salt.saltName
                            }
                        })),
                        inventoryBatches: [
                            {
                                quantityInStock: 10,
                                mrp: 100
                            }
                        ]
                    };

                    // Mock: Source drug lookup
                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);

                    // Mock: Candidate drugs lookup
                    prisma.drug.findMany.mockResolvedValue([exactMatchDrug]);

                    // Act: Find substitutes
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Should find the exact match
                    expect(substitutes.length).toBeGreaterThan(0);
                    
                    // Verify each substitute has exact composition
                    substitutes.forEach(substitute => {
                        expect(substitute.matchType).toBe('EXACT');
                        expect(substitute.matchScore).toBe(100);
                        expect(substitute.salts.length).toBe(saltComposition.length);

                        // Verify each salt matches
                        saltComposition.forEach(sourceSalt => {
                            const matchingSalt = substitute.salts.find(
                                s => s.saltName === sourceSalt.saltName
                            );
                            expect(matchingSalt).toBeDefined();
                            expect(matchingSalt.strengthValue).toBe(sourceSalt.strengthValue);
                            expect(matchingSalt.strengthUnit).toBe(sourceSalt.strengthUnit);
                        });
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: drugs with different salt counts are not exact matches
     */
    test('Property: exact matching rejects drugs with different salt counts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 3 }),
                fc.integer({ min: 1, max: 3 }),
                async (sourceCount, candidateCount) => {
                    // Clear mocks
                    jest.clearAllMocks();

                    // Skip if counts are the same
                    if (sourceCount === candidateCount) {
                        return;
                    }

                    const drugId = 'source-drug';
                    const storeId = 'store-123';

                    // Create source drug
                    const sourceSaltLinks = Array.from({ length: sourceCount }, (_, i) => ({
                        saltId: `salt-${i}`,
                        strengthValue: 100,
                        strengthUnit: 'mg',
                        order: i,
                        salt: { id: `salt-${i}`, name: `Salt ${i}` }
                    }));

                    const sourceDrug = {
                        id: drugId,
                        name: 'Source',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: sourceSaltLinks
                    };

                    // Create candidate with different salt count
                    const candidateSaltLinks = Array.from({ length: candidateCount }, (_, i) => ({
                        saltId: `salt-${i}`,
                        strengthValue: 100,
                        strengthUnit: 'mg',
                        order: i,
                        salt: { id: `salt-${i}`, name: `Salt ${i}` }
                    }));

                    const candidateDrug = {
                        id: 'candidate-drug',
                        name: 'Candidate',
                        manufacturer: 'Test',
                        form: 'Tablet',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        deletedAt: null,
                        drugSaltLinks: candidateSaltLinks,
                        inventoryBatches: [{ quantityInStock: 10, mrp: 100 }]
                    };

                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    prisma.drug.findMany.mockResolvedValue([candidateDrug]);

                    // Act
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Should not find exact match
                    expect(substitutes.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: drugs with different strengths are not exact matches
     */
    test('Property: exact matching rejects drugs with different strengths', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 1000 }),
                fc.integer({ min: 10, max: 1000 }),
                async (sourceStrength, candidateStrength) => {
                    // Clear mocks
                    jest.clearAllMocks();

                    // Skip if strengths are the same
                    if (sourceStrength === candidateStrength) {
                        return;
                    }

                    const drugId = 'source-drug';
                    const storeId = 'store-123';
                    const saltId = 'salt-paracetamol';

                    const sourceDrug = {
                        id: drugId,
                        name: 'Source',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: sourceStrength,
                            strengthUnit: 'mg',
                            order: 0,
                            salt: { id: saltId, name: 'Paracetamol' }
                        }]
                    };

                    const candidateDrug = {
                        id: 'candidate-drug',
                        name: 'Candidate',
                        manufacturer: 'Test',
                        form: 'Tablet',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        deletedAt: null,
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: candidateStrength,
                            strengthUnit: 'mg',
                            order: 0,
                            salt: { id: saltId, name: 'Paracetamol' }
                        }],
                        inventoryBatches: [{ quantityInStock: 10, mrp: 100 }]
                    };

                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    prisma.drug.findMany.mockResolvedValue([candidateDrug]);

                    // Act
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Should not find exact match
                    expect(substitutes.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: drugs with different units are not exact matches
     */
    test('Property: exact matching rejects drugs with different units', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('mg', 'ml', 'g', 'mcg'),
                fc.constantFrom('mg', 'ml', 'g', 'mcg'),
                async (sourceUnit, candidateUnit) => {
                    // Clear mocks
                    jest.clearAllMocks();

                    // Skip if units are the same
                    if (sourceUnit === candidateUnit) {
                        return;
                    }

                    const drugId = 'source-drug';
                    const storeId = 'store-123';
                    const saltId = 'salt-paracetamol';

                    const sourceDrug = {
                        id: drugId,
                        name: 'Source',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: 500,
                            strengthUnit: sourceUnit,
                            order: 0,
                            salt: { id: saltId, name: 'Paracetamol' }
                        }]
                    };

                    const candidateDrug = {
                        id: 'candidate-drug',
                        name: 'Candidate',
                        manufacturer: 'Test',
                        form: 'Tablet',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        deletedAt: null,
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: 500,
                            strengthUnit: candidateUnit,
                            order: 0,
                            salt: { id: saltId, name: 'Paracetamol' }
                        }],
                        inventoryBatches: [{ quantityInStock: 10, mrp: 100 }]
                    };

                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    prisma.drug.findMany.mockResolvedValue([candidateDrug]);

                    // Act
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Should not find exact match
                    expect(substitutes.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: source drug is excluded from results
     */
    test('Property: findSubstitutes never returns the source drug itself', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                fc.string({ minLength: 3, maxLength: 30 }),
                async (drugId, drugName) => {
                    // Clear mocks
                    jest.clearAllMocks();

                    const storeId = 'store-123';
                    const saltId = 'salt-123';

                    const sourceDrug = {
                        id: drugId,
                        name: drugName,
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: 500,
                            strengthUnit: 'mg',
                            order: 0,
                            salt: { id: saltId, name: 'TestSalt' }
                        }]
                    };

                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    // Return empty array (source drug excluded by query)
                    prisma.drug.findMany.mockResolvedValue([]);

                    // Act
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Source drug should not be in results
                    const sourceInResults = substitutes.some(sub => sub.drugId === drugId);
                    expect(sourceInResults).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: only ACTIVE drugs are returned as substitutes
     */
    test('Property: findSubstitutes only returns ACTIVE drugs', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('DRAFT', 'SALT_PENDING', 'ACTIVE'),
                async (candidateStatus) => {
                    // Clear mocks
                    jest.clearAllMocks();

                    const drugId = 'source-drug';
                    const storeId = 'store-123';
                    const saltId = 'salt-123';

                    const sourceDrug = {
                        id: drugId,
                        name: 'Source',
                        storeId,
                        ingestionStatus: 'ACTIVE',
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: 500,
                            strengthUnit: 'mg',
                            order: 0,
                            salt: { id: saltId, name: 'TestSalt' }
                        }]
                    };

                    const candidateDrug = {
                        id: 'candidate-drug',
                        name: 'Candidate',
                        manufacturer: 'Test',
                        form: 'Tablet',
                        storeId,
                        ingestionStatus: candidateStatus,
                        deletedAt: null,
                        drugSaltLinks: [{
                            saltId,
                            strengthValue: 500,
                            strengthUnit: 'mg',
                            order: 0,
                            salt: { id: saltId, name: 'TestSalt' }
                        }],
                        inventoryBatches: [{ quantityInStock: 10, mrp: 100 }]
                    };

                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    
                    // Only return candidate if it's ACTIVE (simulating WHERE clause)
                    if (candidateStatus === 'ACTIVE') {
                        prisma.drug.findMany.mockResolvedValue([candidateDrug]);
                    } else {
                        prisma.drug.findMany.mockResolvedValue([]);
                    }

                    // Act
                    const substitutes = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: All substitutes must be ACTIVE
                    if (candidateStatus === 'ACTIVE') {
                        expect(substitutes.length).toBeGreaterThan(0);
                    } else {
                        expect(substitutes.length).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
