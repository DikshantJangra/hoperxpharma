/**
 * Enhanced Regex Matcher for Salt Composition Parsing
 * 
 * Parses composition strings into structured salt data with multiple pattern support.
 * Validates: Requirements 2.3, 2.4, 2.5
 */

export interface ExtractedComponent {
  name: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  originalText: string;
}

export interface ParsingOptions {
  strictMode?: boolean;
  allowPartialMatch?: boolean;
}

export class RegexMatcher {
  // Enhanced regex patterns - tried in order
  private static readonly PATTERNS = {
    // "Paracetamol (500mg)" or "Paracetamol (500 mg)"
    parenthesized: /^(.+?)\s*\(\s*([\d\.]+)\s*([a-zA-Z\/%]+)\s*\)$/,
    
    // "Paracetamol IP 500mg" or "Paracetamol BP 500 mg"
    withSuffix: /^(.+?)\s+(IP|BP|USP)\s+([\d\.]+)\s*([a-zA-Z\/%]+)$/i,
    
    // "Paracetamol 500mg" or "Paracetamol 500 mg"
    spaced: /^(.+?)\s+([\d\.]+)\s*([a-zA-Z\/%]+)$/,
    
    // "Paracetamol" (name only, no strength)
    nameOnly: /^(.+?)$/,
  };

  // Common delimiters for multi-salt compositions
  private static readonly DELIMITERS = /\s*[+\/&,]\s*/;

  // Composition keywords for filtering OCR text
  private static readonly COMPOSITION_KEYWORDS = [
    /composition/i,
    /contains/i,
    /each\s+(tablet|capsule|ml|gm)/i,
    /\bip\b/i,
    /\bbp\b/i,
    /\busp\b/i,
  ];

  /**
   * Parse a composition string into structured salt components
   * @param composition - Raw composition string (e.g., "Paracetamol 500mg + Caffeine 65mg")
   * @param options - Parsing options
   * @returns Array of extracted components
   */
  static parseComposition(
    composition: string,
    options: ParsingOptions = {}
  ): ExtractedComponent[] {
    if (!composition || typeof composition !== 'string') {
      return [];
    }

    // Normalize whitespace
    const normalized = composition.trim().replace(/\s+/g, ' ');

    // Split by delimiters to handle multi-salt compositions
    const parts = normalized.split(this.DELIMITERS);

    // Parse each part
    const components = parts
      .map((part, index) => this.parseSingleComponent(part.trim(), index))
      .filter((component): component is ExtractedComponent => component !== null);

    return components;
  }

  /**
   * Parse a single salt component
   * @private
   */
  private static parseSingleComponent(
    text: string,
    order: number
  ): ExtractedComponent | null {
    if (!text) {
      return null;
    }

    // Try each pattern in order
    for (const [patternName, pattern] of Object.entries(this.PATTERNS)) {
      const match = text.match(pattern);

      if (match) {
        if (patternName === 'parenthesized') {
          return this.buildComponent(
            match[1],
            match[2],
            match[3],
            text,
            'HIGH'
          );
        } else if (patternName === 'withSuffix') {
          // Extract name without suffix (IP/BP/USP)
          return this.buildComponent(
            match[1],
            match[3],
            match[4],
            text,
            'HIGH'
          );
        } else if (patternName === 'spaced') {
          return this.buildComponent(
            match[1],
            match[2],
            match[3],
            text,
            'HIGH'
          );
        } else if (patternName === 'nameOnly') {
          // Name only, no strength
          return this.buildComponent(
            match[1],
            null,
            null,
            text,
            'MEDIUM'
          );
        }
      }
    }

    // No pattern matched
    return this.buildComponent(text, null, null, text, 'LOW');
  }

  /**
   * Build a component object from parsed values
   * @private
   */
  private static buildComponent(
    name: string,
    strengthValue: string | null,
    strengthUnit: string | null,
    originalText: string,
    baseConfidence: 'HIGH' | 'MEDIUM' | 'LOW'
  ): ExtractedComponent {
    const cleanedName = this.cleanSaltName(name);
    const normalizedUnit = strengthUnit ? this.normalizeUnit(strengthUnit) : null;
    const parsedValue = strengthValue ? parseFloat(strengthValue) : null;

    const component: ExtractedComponent = {
      name: cleanedName,
      strengthValue: parsedValue,
      strengthUnit: normalizedUnit,
      confidence: baseConfidence,
      originalText,
    };

    // Recalculate confidence based on completeness
    component.confidence = this.calculateConfidence(component);

    return component;
  }

  /**
   * Clean salt name by removing suffixes and normalizing
   * @private
   */
  private static cleanSaltName(name: string): string {
    let cleaned = name.trim();

    // Remove IP/BP/USP suffixes if present
    cleaned = cleaned.replace(/\s+(IP|BP|USP)$/i, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove special characters at start/end
    cleaned = cleaned.replace(/^[^\w]+|[^\w]+$/g, '');

    // Capitalize first letter of each word
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return cleaned;
  }

  /**
   * Normalize strength unit
   * @private
   */
  private static normalizeUnit(unit: string): string {
    let normalized = unit.trim().toLowerCase();

    // Handle common variations
    const unitMap: Record<string, string> = {
      'mg': 'mg',
      'mgm': 'mg',
      'milligram': 'mg',
      'milligrams': 'mg',
      'gm': 'g',
      'gram': 'g',
      'grams': 'g',
      'ml': 'ml',
      'milliliter': 'ml',
      'milliliters': 'ml',
      'mcg': 'mcg',
      'microgram': 'mcg',
      'micrograms': 'mcg',
      'iu': 'IU',
      'units': 'IU',
      '%': '%',
      'percent': '%',
    };

    return unitMap[normalized] || normalized;
  }

  /**
   * Calculate confidence score based on component completeness
   * @private
   */
  private static calculateConfidence(
    component: ExtractedComponent
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    const hasName = component.name && component.name.length > 0;
    const hasStrength = component.strengthValue !== null && component.strengthValue > 0;
    const hasUnit = component.strengthUnit !== null && component.strengthUnit.length > 0;

    // HIGH: name + strength + unit all present
    if (hasName && hasStrength && hasUnit) {
      return 'HIGH';
    }

    // MEDIUM: name + partial strength/unit
    if (hasName && (hasStrength || hasUnit)) {
      return 'MEDIUM';
    }

    // LOW: name only or parsing failed
    return 'LOW';
  }

  /**
   * Filter OCR text to lines containing composition keywords
   * @param text - Raw OCR text
   * @returns Filtered text containing only relevant lines
   */
  static filterRelevantLines(text: string): string {
    if (!text) {
      return '';
    }

    const lines = text.split('\n');
    const relevantLines = lines.filter(line => {
      return this.COMPOSITION_KEYWORDS.some(keyword => keyword.test(line));
    });

    return relevantLines.join('\n');
  }

  /**
   * Validate a parsed component
   * @param component - Component to validate
   * @returns Validation result with errors
   */
  static validateComponent(component: ExtractedComponent): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Name validation
    if (!component.name || component.name.length < 2) {
      errors.push('Salt name must be at least 2 characters');
    }

    // Strength validation
    if (component.strengthValue !== null) {
      if (component.strengthValue <= 0) {
        errors.push('Strength value must be greater than 0');
      }
      if (component.strengthValue > 10000) {
        errors.push('Warning: Strength value seems unusually high');
      }
      if (!component.strengthUnit) {
        errors.push('Strength unit is required when value is provided');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format components back to composition string (for round-trip testing)
   * @param components - Array of components
   * @returns Formatted composition string
   */
  static formatComposition(components: ExtractedComponent[]): string {
    return components
      .map(comp => {
        if (comp.strengthValue && comp.strengthUnit) {
          return `${comp.name} ${comp.strengthValue}${comp.strengthUnit}`;
        }
        return comp.name;
      })
      .join(' + ');
  }
}
