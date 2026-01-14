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
  // Common delimiters for multi-salt compositions
  private static readonly DELIMITERS = /\s*[+&]\s*|\s*,\s*(?![0-9])/;

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

    // Normalize whitespace and clean up
    let normalized = composition.trim().replace(/\s+/g, ' ');
    
    // Remove common prefixes
    normalized = normalized.replace(/^(composition:?\s*|contains:?\s*|each\s+\w+\s+contains:?\s*)/i, '');

    // Split by delimiters to handle multi-salt compositions
    // Be careful not to split on commas within numbers like "6,00,000"
    const parts = normalized.split(this.DELIMITERS);

    // Parse each part
    const components = parts
      .map((part, index) => this.parseSingleComponent(part.trim(), index))
      .filter((component): component is ExtractedComponent => component !== null);

    return components;
  }

  /**
   * Parse a single salt component with enhanced pattern matching
   * @private
   */
  private static parseSingleComponent(
    text: string,
    order: number
  ): ExtractedComponent | null {
    if (!text || text.length < 2) {
      return null;
    }

    // Clean up the text
    let cleanText = text.trim();
    
    // Skip if it's just numbers or units
    if (/^[\d\s,\.]+$/.test(cleanText) || /^(mg|mcg|g|ml|iu|%|w\/w|w\/v)$/i.test(cleanText)) {
      return null;
    }

    // Try to extract using enhanced patterns
    const extracted = this.extractSaltInfo(cleanText);
    
    if (extracted) {
      return this.buildComponent(
        extracted.name,
        extracted.strength,
        extracted.unit,
        text,
        extracted.confidence
      );
    }

    // Fallback: treat entire text as name
    return this.buildComponent(cleanText, null, null, text, 'LOW');
  }

  /**
   * Extract salt name, strength, and unit from text
   * Handles complex Indian pharmaceutical formats
   * @private
   */
  private static extractSaltInfo(text: string): {
    name: string;
    strength: string | null;
    unit: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  } | null {
    // Pattern 1: Handle IU format with Indian number system (e.g., "6,00,000 I.U." or "600000 IU")
    // Example: "Cholecalciferol (Vit D3) I.P. 6,00,000 I.U. (15 mg.)"
    const iuPattern = /^(.+?)\s+([\d,]+)\s*I\.?U\.?\s*(?:\([\d\.]+\s*mg\.?\))?$/i;
    let match = text.match(iuPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, ''); // Remove commas from Indian number format
      return { name, strength: strengthStr, unit: 'IU', confidence: 'HIGH' };
    }

    // Pattern 2: Handle format with parenthesized alternate name and strength at end
    // Example: "Cholecalciferol (Vit D3) I.P. 600000 IU"
    const altNamePattern = /^(.+?\s*\([^)]+\))\s*(?:I\.?P\.?|B\.?P\.?|U\.?S\.?P\.?)?\s*([\d,\.]+)\s*([a-zA-Z\/%\.]+)$/i;
    match = text.match(altNamePattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, '');
      const unit = this.normalizeUnit(match[3]);
      return { name, strength: strengthStr, unit, confidence: 'HIGH' };
    }

    // Pattern 3: Standard format with IP/BP/USP suffix
    // Example: "Paracetamol IP 500mg" or "Amoxicillin BP 250 mg"
    const standardPattern = /^(.+?)\s+(?:I\.?P\.?|B\.?P\.?|U\.?S\.?P\.?)\s*([\d,\.]+)\s*([a-zA-Z\/%]+)$/i;
    match = text.match(standardPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, '');
      const unit = this.normalizeUnit(match[3]);
      return { name, strength: strengthStr, unit, confidence: 'HIGH' };
    }

    // Pattern 4: Name with strength in parentheses
    // Example: "Paracetamol (500mg)" or "Caffeine (65 mg)"
    const parenPattern = /^(.+?)\s*\(\s*([\d,\.]+)\s*([a-zA-Z\/%]+)\s*\)$/;
    match = text.match(parenPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, '');
      const unit = this.normalizeUnit(match[3]);
      return { name, strength: strengthStr, unit, confidence: 'HIGH' };
    }

    // Pattern 5: Simple format - name followed by strength and unit
    // Example: "Paracetamol 500mg" or "Caffeine 65 mg"
    const simplePattern = /^(.+?)\s+([\d,\.]+)\s*([a-zA-Z\/%]+)$/;
    match = text.match(simplePattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, '');
      const unit = this.normalizeUnit(match[3]);
      return { name, strength: strengthStr, unit, confidence: 'HIGH' };
    }

    // Pattern 6: Percentage format for creams/ointments
    // Example: "Diclofenac Sodium 1% w/w"
    const percentPattern = /^(.+?)\s+([\d\.]+)\s*%\s*(w\/w|w\/v)?$/i;
    match = text.match(percentPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const unit = match[3] ? `% ${match[3]}` : '%';
      return { name, strength: match[2], unit, confidence: 'HIGH' };
    }

    // Pattern 7: Liquid format (mg/ml or mg/5ml)
    // Example: "Amoxicillin 250mg/5ml"
    const liquidPattern = /^(.+?)\s+([\d,\.]+)\s*([a-zA-Z]+)\s*\/\s*([\d]*\s*[a-zA-Z]+)$/i;
    match = text.match(liquidPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      const strengthStr = match[2].replace(/,/g, '');
      const unit = `${match[3]}/${match[4]}`;
      return { name, strength: strengthStr, unit, confidence: 'HIGH' };
    }

    // Pattern 8: Name only with IP/BP/USP (no strength)
    const nameOnlyWithStdPattern = /^(.+?)\s+(?:I\.?P\.?|B\.?P\.?|U\.?S\.?P\.?)$/i;
    match = text.match(nameOnlyWithStdPattern);
    if (match) {
      const name = this.cleanSaltName(match[1]);
      return { name, strength: null, unit: null, confidence: 'MEDIUM' };
    }

    // No pattern matched - return name only
    const cleanedName = this.cleanSaltName(text);
    if (cleanedName.length >= 2) {
      return { name: cleanedName, strength: null, unit: null, confidence: 'LOW' };
    }

    return null;
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

    // Remove IP/BP/USP suffixes if present at the end
    cleaned = cleaned.replace(/\s+(I\.?P\.?|B\.?P\.?|U\.?S\.?P\.?)\s*$/i, '');

    // Remove "q.s." or "q.s" (quantum satis - as much as needed)
    cleaned = cleaned.replace(/\s*q\.?s\.?\s*$/i, '');

    // Remove trailing periods
    cleaned = cleaned.replace(/\.\s*$/, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove special characters at start/end (but keep parentheses for alternate names)
    cleaned = cleaned.replace(/^[^\w(]+|[^\w)]+$/g, '');

    // Capitalize first letter of each word (but preserve parenthesized content)
    cleaned = cleaned
      .split(' ')
      .map(word => {
        if (word.startsWith('(')) {
          return '(' + word.slice(1).charAt(0).toUpperCase() + word.slice(2).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    return cleaned;
  }

  /**
   * Normalize strength unit
   * @private
   */
  private static normalizeUnit(unit: string): string {
    let normalized = unit.trim().toLowerCase();
    
    // Remove trailing periods
    normalized = normalized.replace(/\.$/, '');

    // Handle common variations
    const unitMap: Record<string, string> = {
      'mg': 'mg',
      'mgm': 'mg',
      'milligram': 'mg',
      'milligrams': 'mg',
      'gm': 'g',
      'g': 'g',
      'gram': 'g',
      'grams': 'g',
      'ml': 'ml',
      'milliliter': 'ml',
      'milliliters': 'ml',
      'mcg': 'mcg',
      'µg': 'mcg',
      'microgram': 'mcg',
      'micrograms': 'mcg',
      'iu': 'IU',
      'i.u': 'IU',
      'i.u.': 'IU',
      'units': 'IU',
      '%': '%',
      'percent': '%',
    };

    return unitMap[normalized] || unit.trim();
  }

  /**
   * Calculate confidence score based on component completeness
   * @private
   */
  private static calculateConfidence(
    component: ExtractedComponent
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    const hasName = component.name && component.name.length > 2;
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
      // Allow high values for IU (vitamins can have 600000 IU)
      if (component.strengthValue > 10000000) {
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
