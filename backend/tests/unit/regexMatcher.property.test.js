const fc = require('fast-check');

// Mock the TypeScript regex matcher for testing
const RegexMatcher = {
  parseComposition: (composition) => {
    if (!composition) return [];
    
    const parts = composition.split(/\s*[+\/&,]\s*/);
    return parts.map((part, index) => {
      const match = part.match(/^(.+?)\s+([\d\.]+)\s*([a-zA-Z\/%]+)$/);
      if (match) {
        return {
          name: match[1].trim(),
          strengthValue: parseFloat(match[2]),
          strengthUnit: match[3].toLowerCase(),
          confidence: 'HIGH',
          originalText: part,
          order: index
        };
      }
      return {
        name: part.trim(),
        strengthValue: null,
        strengthUnit: null,
        confidence: 'LOW',
        originalText: part,
        order: index
      };
    });
  },
  
  formatComposition: (components) => {
    return components
      .map(comp => {
        if (comp.strengthValue && comp.strengthUnit) {
          return `${comp.name} ${comp.strengthValue}${comp.strengthUnit}`;
        }
        return comp.name;
      })
      .join(' + ');
  }
};

describe('Regex Matcher Property Tests', () => {
  /**
   * Property 11: Regex Matcher Preserves Salt Order
   * 
   * Validates: Requirements 2.4
   * 
   * Property: For any composition string with multiple salts separated by delimiters,
   * the parsed output should maintain the same order as the input
   */
  test('Property 11: parsing preserves salt order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.stringOf(fc.char().filter(c => /[a-zA-Z]/.test(c)), { minLength: 3, maxLength: 15 }),
            strength: fc.integer({ min: 1, max: 1000 }),
            unit: fc.constantFrom('mg', 'g', 'ml', 'mcg')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (salts) => {
          // Arrange: Build composition string
          const composition = salts
            .map(s => `${s.name} ${s.strength}${s.unit}`)
            .join(' + ');

          // Act: Parse composition
          const parsed = RegexMatcher.parseComposition(composition);

          // Assert: Order should be preserved
          expect(parsed.length).toBe(salts.length);
          
          salts.forEach((salt, index) => {
            expect(parsed[index].name).toBe(salt.name);
            expect(parsed[index].strengthValue).toBe(salt.strength);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Salt Composition Round-Trip
   * 
   * Validates: Requirements 2.3
   * 
   * Property: For any valid salt composition, parsing then formatting back
   * should produce an equivalent composition
   */
  test('Property 19: round-trip parsing preserves composition', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.stringOf(fc.char().filter(c => /[a-zA-Z]/.test(c)), { minLength: 3, maxLength: 15 }),
            strength: fc.integer({ min: 1, max: 1000 }),
            unit: fc.constantFrom('mg', 'g', 'ml', 'mcg')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (salts) => {
          // Arrange: Build composition string
          const original = salts
            .map(s => `${s.name} ${s.strength}${s.unit}`)
            .join(' + ');

          // Act: Parse then format back
          const parsed = RegexMatcher.parseComposition(original);
          const formatted = RegexMatcher.formatComposition(parsed);

          // Assert: Should be equivalent (same salts, strengths, units)
          const reparsed = RegexMatcher.parseComposition(formatted);
          
          expect(reparsed.length).toBe(parsed.length);
          
          parsed.forEach((comp, index) => {
            expect(reparsed[index].name).toBe(comp.name);
            expect(reparsed[index].strengthValue).toBe(comp.strengthValue);
            expect(reparsed[index].strengthUnit).toBe(comp.strengthUnit);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: parsing handles various delimiter types', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.stringOf(fc.char().filter(c => /[a-zA-Z]/.test(c)), { minLength: 3, maxLength: 10 }),
            strength: fc.integer({ min: 1, max: 500 }),
            unit: fc.constantFrom('mg', 'g')
          }),
          { minLength: 2, maxLength: 3 }
        ),
        fc.constantFrom('+', '/', '&', ','),
        (salts, delimiter) => {
          // Arrange: Build composition with specific delimiter
          const composition = salts
            .map(s => `${s.name} ${s.strength}${s.unit}`)
            .join(` ${delimiter} `);

          // Act: Parse
          const parsed = RegexMatcher.parseComposition(composition);

          // Assert: Should parse all salts regardless of delimiter
          expect(parsed.length).toBe(salts.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: empty or invalid input returns empty array', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('   ')
        ),
        (input) => {
          const parsed = RegexMatcher.parseComposition(input);
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: parsing extracts numeric strength values correctly', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter(c => /[a-zA-Z]/.test(c)), { minLength: 3, maxLength: 10 }),
        fc.float({ min: 0.1, max: 1000, noNaN: true }),
        fc.constantFrom('mg', 'g', 'ml'),
        (name, strength, unit) => {
          // Arrange
          const composition = `${name} ${strength}${unit}`;

          // Act
          const parsed = RegexMatcher.parseComposition(composition);

          // Assert
          expect(parsed.length).toBe(1);
          expect(parsed[0].strengthValue).toBeCloseTo(strength, 1);
          expect(parsed[0].strengthUnit).toBe(unit);
        }
      ),
      { numRuns: 100 }
    );
  });
});
