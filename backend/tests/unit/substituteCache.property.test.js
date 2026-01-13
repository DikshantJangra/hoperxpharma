const fc = require('fast-check');
const substituteService = require('../../src/services/substituteService');
const cacheService = require('../../src/services/cacheService');

// Mock Prisma
jest.mock('../../src/db/prisma', () => ({
    drug: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
}));

const prisma = require('../../src/db/prisma');

describe('Substitute Cache Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheService.clear();
    });

    afterAll(() => {
        cacheService.shutdown();
    });

    /**
     * Property 14: Cache Invalidation on Update
     * 
     * Validates: Requirements 8.4
     * 
     * Property: When a drug's salt mapping is updated, its substitute cache
     * should be invalidated immediately
     */
    test('Property: cache invalidation removes all entries for a drug', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
                (drugId, storeIds) => {
                    // Arrange: Set cache entries for drug across multiple stores
                    storeIds.forEach(storeId => {
                        const cacheKey = `substitutes:${drugId}:${storeId}:false`;
                        cacheService.set(cacheKey, [], 3600);
                    });

                    // Verify cache entries exist
                    const beforeCount = storeIds.filter(storeId => {
                        const key = `substitutes:${drugId}:${storeId}:false`;
                        return cacheService.get(key) !== null;
                    }).length;
                    expect(beforeCount).toBe(storeIds.length);

                    // Act: Invalidate cache for drug
                    substituteService.invalidateCache(drugId);

                    // Assert: All cache entries for this drug should be gone
                    const afterCount = storeIds.filter(storeId => {
                        const key = `substitutes:${drugId}:${storeId}:false`;
                        return cacheService.get(key) !== null;
                    }).length;
                    expect(afterCount).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 20: Substitute Cache TTL
     * 
     * Validates: Requirements 8.4
     * 
     * Property: Repeated queries within 1 hour should return cached results
     * without database access
     */
    test('Property: cache returns same results without database queries', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                fc.uuid(),
                async (drugId, storeId) => {
                    // Clear mocks
                    jest.clearAllMocks();
                    cacheService.clear();

                    const saltId = 'salt-123';
                    const sourceDrug = {
                        id: drugId,
                        name: 'Test Drug',
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

                    // Mock first call
                    prisma.drug.findUnique.mockResolvedValue(sourceDrug);
                    prisma.drug.findMany.mockResolvedValue([]);

                    // Act: First call (should hit database)
                    const result1 = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Verify database was called
                    expect(prisma.drug.findUnique).toHaveBeenCalledTimes(1);
                    expect(prisma.drug.findMany).toHaveBeenCalledTimes(1);

                    // Clear mocks
                    jest.clearAllMocks();

                    // Act: Second call (should hit cache)
                    const result2 = await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: false
                    });

                    // Assert: Database should NOT be called
                    expect(prisma.drug.findUnique).not.toHaveBeenCalled();
                    expect(prisma.drug.findMany).not.toHaveBeenCalled();

                    // Results should be identical
                    expect(result2).toEqual(result1);
                }
            ),
            { numRuns: 50 } // Reduced runs for async test
        );
    });

    test('Property: cache respects TTL and expires after timeout', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 20 }),
                fc.integer({ min: 1, max: 5 }),
                (key, ttlSeconds) => {
                    // Arrange: Set cache with short TTL
                    const value = { test: 'data' };
                    cacheService.set(key, value, ttlSeconds);

                    // Act: Get immediately (should exist)
                    const immediate = cacheService.get(key);
                    expect(immediate).toEqual(value);

                    // Simulate time passing (mock Date.now)
                    const originalNow = Date.now;
                    Date.now = jest.fn(() => originalNow() + (ttlSeconds * 1000) + 1000);

                    // Act: Get after expiry (should be null)
                    const afterExpiry = cacheService.get(key);

                    // Restore Date.now
                    Date.now = originalNow;

                    // Assert: Should be expired
                    expect(afterExpiry).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: invalidating one drug does not affect other drugs', () => {
        fc.assert(
            fc.property(
                fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
                fc.uuid(),
                (drugIds, storeId) => {
                    // Ensure we have at least 2 unique drug IDs
                    const uniqueDrugIds = [...new Set(drugIds)];
                    if (uniqueDrugIds.length < 2) {
                        return; // Skip this case
                    }

                    // Arrange: Set cache for all drugs
                    uniqueDrugIds.forEach(drugId => {
                        const cacheKey = `substitutes:${drugId}:${storeId}:false`;
                        cacheService.set(cacheKey, [], 3600);
                    });

                    // Act: Invalidate first drug only
                    const targetDrugId = uniqueDrugIds[0];
                    substituteService.invalidateCache(targetDrugId);

                    // Assert: First drug cache should be gone
                    const targetKey = `substitutes:${targetDrugId}:${storeId}:false`;
                    expect(cacheService.get(targetKey)).toBeNull();

                    // Assert: Other drugs' caches should still exist
                    for (let i = 1; i < uniqueDrugIds.length; i++) {
                        const otherKey = `substitutes:${uniqueDrugIds[i]}:${storeId}:false`;
                        expect(cacheService.get(otherKey)).not.toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: store cache invalidation removes all entries for that store', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
                (storeId, drugIds) => {
                    // Arrange: Set cache entries for multiple drugs in this store
                    drugIds.forEach(drugId => {
                        const cacheKey = `substitutes:${drugId}:${storeId}:false`;
                        cacheService.set(cacheKey, [], 3600);
                    });

                    // Verify cache entries exist
                    const beforeCount = drugIds.filter(drugId => {
                        const key = `substitutes:${drugId}:${storeId}:false`;
                        return cacheService.get(key) !== null;
                    }).length;
                    expect(beforeCount).toBe(drugIds.length);

                    // Act: Invalidate cache for store
                    substituteService.invalidateStoreCache(storeId);

                    // Assert: All cache entries for this store should be gone
                    const afterCount = drugIds.filter(drugId => {
                        const key = `substitutes:${drugId}:${storeId}:false`;
                        return cacheService.get(key) !== null;
                    }).length;
                    expect(afterCount).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: cache key includes all query parameters', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                fc.uuid(),
                fc.boolean(),
                async (drugId, storeId, includePartial) => {
                    // Clear everything
                    jest.clearAllMocks();
                    cacheService.clear();

                    const saltId = 'salt-123';
                    const sourceDrug = {
                        id: drugId,
                        name: 'Test Drug',
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
                    prisma.drug.findMany.mockResolvedValue([]);

                    // Act: Call with specific parameters
                    await substituteService.findSubstitutes({
                        drugId,
                        storeId,
                        includePartialMatches: includePartial
                    });

                    // Assert: Cache key should include all parameters
                    const expectedKey = `substitutes:${drugId}:${storeId}:${includePartial}`;
                    const cached = cacheService.get(expectedKey);
                    expect(cached).not.toBeNull();

                    // Different parameters should have different cache entries
                    const differentKey = `substitutes:${drugId}:${storeId}:${!includePartial}`;
                    const differentCached = cacheService.get(differentKey);
                    expect(differentCached).toBeNull();
                }
            ),
            { numRuns: 50 }
        );
    });
});
