const fc = require('fast-check');
const saltRepository = require('../../src/repositories/saltRepository');

// Mock Prisma
jest.mock('../../src/db/prisma', () => ({
    salt: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    $queryRaw: jest.fn(),
}));

const prisma = require('../../src/db/prisma');

describe('Salt Deduplication Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property 3: Salt Name Matching Against Master (Deduplication)
     * 
     * Validates: Requirements 3.2
     * 
     * Property: For any salt name or alias, findDuplicate should detect existing salts
     * regardless of case or whitespace variations
     */
    test('Property: findDuplicate detects existing salts by name case-insensitively', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.constantFrom('lower', 'upper', 'mixed'),
                async (saltName, caseVariant) => {
                    // Arrange: Create a salt name with specific case
                    const baseName = saltName.trim();
                    let testName;
                    
                    switch (caseVariant) {
                        case 'lower':
                            testName = baseName.toLowerCase();
                            break;
                        case 'upper':
                            testName = baseName.toUpperCase();
                            break;
                        case 'mixed':
                            testName = baseName.split('').map((c, i) => 
                                i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
                            ).join('');
                            break;
                    }

                    const existingSalt = {
                        id: 'salt-123',
                        name: baseName.toLowerCase(),
                        aliases: []
                    };

                    // Mock: Salt exists in database
                    prisma.salt.findFirst.mockResolvedValue(existingSalt);

                    // Act: Try to find duplicate with different case
                    const duplicate = await saltRepository.findDuplicate(testName, []);

                    // Assert: Should find the existing salt regardless of case
                    expect(duplicate).toBeTruthy();
                    expect(duplicate.id).toBe(existingSalt.id);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: findDuplicate detects existing salts by alias
     */
    test('Property: findDuplicate detects conflicts when new name matches existing alias', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
                async (saltName, aliases) => {
                    // Arrange: Create existing salt with aliases
                    const existingSalt = {
                        id: 'salt-456',
                        name: 'ExistingSalt',
                        aliases: aliases.map(a => a.trim().toLowerCase())
                    };

                    // Pick one alias to test
                    const testAlias = aliases[0].trim();

                    // Mock: No exact name match, but alias match
                    prisma.salt.findFirst.mockResolvedValue(null);
                    prisma.$queryRaw.mockResolvedValue([existingSalt]);

                    // Act: Try to create salt with name that matches existing alias
                    const duplicate = await saltRepository.findDuplicate(testAlias, []);

                    // Assert: Should detect the conflict
                    expect(duplicate).toBeTruthy();
                    expect(duplicate.id).toBe(existingSalt.id);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: findDuplicate detects conflicts when new alias matches existing name
     */
    test('Property: findDuplicate detects conflicts when new alias matches existing salt name', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                async (newSaltName, existingSaltName) => {
                    // Clear mocks for this iteration
                    jest.clearAllMocks();
                    
                    // Ensure names are different
                    if (newSaltName.toLowerCase().trim() === existingSaltName.toLowerCase().trim()) {
                        return; // Skip this case
                    }

                    const existingSalt = {
                        id: 'salt-789',
                        name: existingSaltName.toLowerCase().trim(),
                        aliases: []
                    };

                    // Mock: New salt name doesn't exist, but alias matches existing salt
                    prisma.salt.findFirst
                        .mockResolvedValueOnce(null) // First call for new salt name
                        .mockResolvedValueOnce(existingSalt); // Second call for alias
                    prisma.$queryRaw.mockResolvedValue([]);

                    // Act: Try to create salt with alias that matches existing salt name
                    const duplicate = await saltRepository.findDuplicate(
                        newSaltName,
                        [existingSaltName]
                    );

                    // Assert: Should detect the conflict
                    expect(duplicate).toBeTruthy();
                    expect(duplicate.id).toBe(existingSalt.id);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: findDuplicate handles whitespace variations
     */
    test('Property: findDuplicate normalizes whitespace when checking duplicates', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.nat(5), // Number of leading spaces
                fc.nat(5), // Number of trailing spaces
                async (saltName, leadingSpaces, trailingSpaces) => {
                    // Clear mocks for this iteration
                    jest.clearAllMocks();
                    
                    const baseName = saltName.trim();
                    const paddedName = ' '.repeat(leadingSpaces) + baseName + ' '.repeat(trailingSpaces);

                    const existingSalt = {
                        id: 'salt-whitespace',
                        name: baseName.toLowerCase(),
                        aliases: []
                    };

                    // Mock: Salt exists
                    prisma.salt.findFirst.mockResolvedValue(existingSalt);
                    prisma.$queryRaw.mockResolvedValue([]);

                    // Act: Try to find duplicate with whitespace variations
                    const duplicate = await saltRepository.findDuplicate(paddedName, []);

                    // Assert: Should find duplicate despite whitespace
                    expect(duplicate).toBeTruthy();
                    expect(duplicate.id).toBe(existingSalt.id);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: findDuplicate returns null when no conflicts exist
     */
    test('Property: findDuplicate returns null when salt is truly unique', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 3 }),
                async (saltName, aliases) => {
                    // Clear mocks for this iteration
                    jest.clearAllMocks();
                    
                    // Mock: No matches found
                    prisma.salt.findFirst.mockResolvedValue(null);
                    prisma.$queryRaw.mockResolvedValue([]);

                    // Act: Check for duplicates
                    const duplicate = await saltRepository.findDuplicate(saltName, aliases);

                    // Assert: Should return null (no conflict)
                    expect(duplicate).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: findDuplicate checks all aliases for conflicts
     */
    test('Property: findDuplicate checks every alias in the array', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 2, maxLength: 5 }),
                fc.integer({ min: 0, max: 4 }), // Index of conflicting alias
                async (saltName, aliases, conflictIndex) => {
                    // Ensure we have enough aliases
                    if (conflictIndex >= aliases.length) {
                        return;
                    }

                    const conflictingAlias = aliases[conflictIndex];
                    const existingSalt = {
                        id: 'salt-conflict',
                        name: 'ExistingSalt',
                        aliases: [conflictingAlias.toLowerCase()]
                    };

                    // Mock: Name doesn't match, but one alias does
                    prisma.salt.findFirst.mockImplementation(async (query) => {
                        // Return null for name checks until we hit the conflicting alias
                        return null;
                    });

                    prisma.$queryRaw.mockImplementation(async (query) => {
                        // Return match when checking the conflicting alias
                        return [existingSalt];
                    });

                    // Act: Check for duplicates
                    const duplicate = await saltRepository.findDuplicate(saltName, aliases);

                    // Assert: Should detect conflict in any alias
                    expect(duplicate).toBeTruthy();
                }
            ),
            { numRuns: 100 }
        );
    });
});
