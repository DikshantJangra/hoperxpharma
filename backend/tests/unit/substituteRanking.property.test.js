const fc = require('fast-check');
const substituteService = require('../../src/services/substituteService');

describe('Substitute Ranking Property Tests', () => {
    /**
     * Property 5: Substitute Ranking Consistency
     * 
     * Validates: Requirements 5.3
     * 
     * Property: Ranking should be deterministic and follow priority rules:
     * 1. Exact matches before partial matches
     * 2. Higher match score first
     * 3. In-stock before out-of-stock
     * 4. Higher stock first
     * 5. Lower price first
     */
    test('Property: ranking is deterministic and consistent', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule', 'Syrup'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.integer({ min: 0, max: 100 }),
                        matchType: fc.constantFrom('EXACT', 'PARTIAL'),
                        matchScore: fc.integer({ min: 50, max: 100 }),
                        salts: fc.array(
                            fc.record({
                                saltName: fc.string({ minLength: 3, maxLength: 20 }),
                                strengthValue: fc.integer({ min: 1, max: 1000 }),
                                strengthUnit: fc.constantFrom('mg', 'ml', 'g')
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (substitutes) => {
                    const sourceDrug = { manufacturer: 'TestPharma' };

                    // Act: Rank twice
                    const ranked1 = substituteService.rankSubstitutes([...substitutes], sourceDrug);
                    const ranked2 = substituteService.rankSubstitutes([...substitutes], sourceDrug);

                    // Assert: Rankings should be identical (deterministic)
                    expect(ranked1.length).toBe(ranked2.length);
                    for (let i = 0; i < ranked1.length; i++) {
                        expect(ranked1[i].drugId).toBe(ranked2[i].drugId);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: exact matches always rank before partial matches', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.integer({ min: 0, max: 100 }),
                        matchType: fc.constantFrom('EXACT', 'PARTIAL'),
                        matchScore: fc.integer({ min: 50, max: 100 }),
                        salts: fc.constant([])
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (substitutes) => {
                    const sourceDrug = {};
                    const ranked = substituteService.rankSubstitutes(substitutes, sourceDrug);

                    // Find first partial match index
                    const firstPartialIndex = ranked.findIndex(s => s.matchType === 'PARTIAL');
                    
                    if (firstPartialIndex === -1) return true; // No partial matches

                    // All items before first partial should be EXACT
                    for (let i = 0; i < firstPartialIndex; i++) {
                        expect(ranked[i].matchType).toBe('EXACT');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: within same match type, higher scores rank first', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('EXACT', 'PARTIAL'),
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.integer({ min: 10, max: 100 }), // All in stock
                        matchScore: fc.integer({ min: 50, max: 100 }),
                        salts: fc.constant([])
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (matchType, substitutes) => {
                    // Set all to same match type
                    const subs = substitutes.map(s => ({ ...s, matchType }));
                    
                    const sourceDrug = {};
                    const ranked = substituteService.rankSubstitutes(subs, sourceDrug);

                    // Check that scores are in descending order (or equal)
                    for (let i = 0; i < ranked.length - 1; i++) {
                        expect(ranked[i].matchScore).toBeGreaterThanOrEqual(ranked[i + 1].matchScore);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: in-stock items rank before out-of-stock', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.integer({ min: 0, max: 100 }),
                        matchType: fc.constant('EXACT'), // Same match type
                        matchScore: fc.constant(100), // Same score
                        salts: fc.constant([])
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (substitutes) => {
                    const sourceDrug = {};
                    const ranked = substituteService.rankSubstitutes(substitutes, sourceDrug);

                    // Find first out-of-stock item
                    const firstOutOfStockIndex = ranked.findIndex(s => s.availableStock === 0);
                    
                    if (firstOutOfStockIndex === -1) return true; // All in stock

                    // All items before first out-of-stock should have stock
                    for (let i = 0; i < firstOutOfStockIndex; i++) {
                        expect(ranked[i].availableStock).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: among in-stock items, higher stock ranks first', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.integer({ min: 1, max: 100 }), // All in stock
                        matchType: fc.constant('EXACT'),
                        matchScore: fc.constant(100),
                        salts: fc.constant([])
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (substitutes) => {
                    const sourceDrug = {};
                    const ranked = substituteService.rankSubstitutes(substitutes, sourceDrug);

                    // Check that stock is in descending order (or equal)
                    for (let i = 0; i < ranked.length - 1; i++) {
                        expect(ranked[i].availableStock).toBeGreaterThanOrEqual(ranked[i + 1].availableStock);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: among same stock, lower price ranks first', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        drugId: fc.uuid(),
                        name: fc.string({ minLength: 3, maxLength: 30 }),
                        manufacturer: fc.string({ minLength: 3, maxLength: 20 }),
                        form: fc.constantFrom('Tablet', 'Capsule'),
                        mrp: fc.float({ min: 1, max: 1000 }),
                        availableStock: fc.constant(10), // Same stock
                        matchType: fc.constant('EXACT'),
                        matchScore: fc.constant(100),
                        salts: fc.constant([])
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (substitutes) => {
                    const sourceDrug = {};
                    const ranked = substituteService.rankSubstitutes(substitutes, sourceDrug);

                    // Check that prices are in ascending order (or equal)
                    for (let i = 0; i < ranked.length - 1; i++) {
                        expect(ranked[i].mrp).toBeLessThanOrEqual(ranked[i + 1].mrp);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
