/**
 * Salt Suggestion Service
 * 
 * Provides intelligent salt/composition suggestions based on medicine names.
 * Uses pattern matching and database lookups to suggest likely active ingredients.
 */

export interface SuggestedSalt {
  name: string;
  strength?: number;
  unit?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'database' | 'pattern' | 'ml';
}

interface PharmaceuticalPattern {
  pattern: RegExp;
  saltName: string;
  defaultUnit?: string;
}

export class SaltSuggestionService {
  // Common pharmaceutical patterns
  private static patterns: PharmaceuticalPattern[] = [
    // Paracetamol variants
    { pattern: /paracetamol|crocin|dolo|calpol|tylenol/i, saltName: 'Paracetamol', defaultUnit: 'mg' },
    { pattern: /acetaminophen/i, saltName: 'Paracetamol', defaultUnit: 'mg' },
    
    // Ibuprofen variants
    { pattern: /ibuprofen|brufen|advil|nurofen/i, saltName: 'Ibuprofen', defaultUnit: 'mg' },
    
    // Antibiotics
    { pattern: /amoxicillin|amoxil|mox/i, saltName: 'Amoxicillin', defaultUnit: 'mg' },
    { pattern: /azithromycin|azithral|zithromax/i, saltName: 'Azithromycin', defaultUnit: 'mg' },
    { pattern: /ciprofloxacin|cipro|ciplox/i, saltName: 'Ciprofloxacin', defaultUnit: 'mg' },
    { pattern: /amoxyclav|augmentin/i, saltName: 'Amoxicillin + Clavulanic Acid', defaultUnit: 'mg' },
    
    // Antihistamines
    { pattern: /cetirizine|zyrtec|cetrizine/i, saltName: 'Cetirizine', defaultUnit: 'mg' },
    { pattern: /loratadine|claritin/i, saltName: 'Loratadine', defaultUnit: 'mg' },
    { pattern: /fexofenadine|allegra/i, saltName: 'Fexofenadine', defaultUnit: 'mg' },
    
    // Antacids
    { pattern: /omeprazole|omez|prilosec/i, saltName: 'Omeprazole', defaultUnit: 'mg' },
    { pattern: /pantoprazole|pan|protonix/i, saltName: 'Pantoprazole', defaultUnit: 'mg' },
    { pattern: /ranitidine|rantac|zantac/i, saltName: 'Ranitidine', defaultUnit: 'mg' },
    { pattern: /esomeprazole|nexium/i, saltName: 'Esomeprazole', defaultUnit: 'mg' },
    
    // Diabetes
    { pattern: /metformin|glucophage/i, saltName: 'Metformin', defaultUnit: 'mg' },
    { pattern: /glimepiride|amaryl/i, saltName: 'Glimepiride', defaultUnit: 'mg' },
    
    // Blood pressure
    { pattern: /amlodipine|norvasc/i, saltName: 'Amlodipine', defaultUnit: 'mg' },
    { pattern: /atenolol|tenormin/i, saltName: 'Atenolol', defaultUnit: 'mg' },
    { pattern: /losartan|cozaar/i, saltName: 'Losartan', defaultUnit: 'mg' },
    { pattern: /telmisartan|micardis/i, saltName: 'Telmisartan', defaultUnit: 'mg' },
    
    // Pain/Inflammation
    { pattern: /diclofenac|voltaren/i, saltName: 'Diclofenac', defaultUnit: 'mg' },
    { pattern: /aspirin|ecosprin/i, saltName: 'Aspirin', defaultUnit: 'mg' },
    { pattern: /naproxen|aleve/i, saltName: 'Naproxen', defaultUnit: 'mg' },
    
    // Vitamins
    { pattern: /vitamin\s*d|cholecalciferol/i, saltName: 'Vitamin D3', defaultUnit: 'IU' },
    { pattern: /vitamin\s*c|ascorbic/i, saltName: 'Vitamin C', defaultUnit: 'mg' },
    { pattern: /vitamin\s*b12|cyanocobalamin/i, saltName: 'Vitamin B12', defaultUnit: 'mcg' },
    { pattern: /folic\s*acid|folate/i, saltName: 'Folic Acid', defaultUnit: 'mg' },
    
    // Cough/Cold
    { pattern: /dextromethorphan/i, saltName: 'Dextromethorphan', defaultUnit: 'mg' },
    { pattern: /phenylephrine/i, saltName: 'Phenylephrine', defaultUnit: 'mg' },
    { pattern: /chlorpheniramine/i, saltName: 'Chlorpheniramine', defaultUnit: 'mg' },
    
    // Steroids
    { pattern: /prednisolone|omnacortil/i, saltName: 'Prednisolone', defaultUnit: 'mg' },
    { pattern: /dexamethasone|decadron/i, saltName: 'Dexamethasone', defaultUnit: 'mg' },
    
    // Antifungal
    { pattern: /fluconazole|diflucan/i, saltName: 'Fluconazole', defaultUnit: 'mg' },
    { pattern: /clotrimazole|canesten/i, saltName: 'Clotrimazole', defaultUnit: 'mg' },
  ];

  /**
   * Suggest salts based on medicine name
   */
  static async suggestSalts(medicineName: string): Promise<SuggestedSalt[]> {
    if (!medicineName || medicineName.trim().length === 0) {
      return [];
    }

    const suggestions: SuggestedSalt[] = [];

    // 1. Extract from name patterns
    const patternSuggestions = this.extractFromName(medicineName);
    suggestions.push(...patternSuggestions);

    // 2. Query database for similar medicines
    try {
      const dbSuggestions = await this.queryDatabase(medicineName);
      suggestions.push(...dbSuggestions);
    } catch (error) {
      console.error('[SaltSuggestion] Database query failed:', error);
    }

    // 3. Remove duplicates and rank by confidence
    const uniqueSuggestions = this.deduplicateAndRank(suggestions);

    return uniqueSuggestions;
  }

  /**
   * Extract salts from medicine name using pattern matching
   */
  private static extractFromName(name: string): SuggestedSalt[] {
    const suggestions: SuggestedSalt[] = [];
    const nameLower = name.toLowerCase();

    // Try to extract strength from name (e.g., "Crocin 500" -> 500)
    const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|%)?/i);
    const strength = strengthMatch ? parseFloat(strengthMatch[1]) : undefined;
    const unit = strengthMatch?.[2]?.toLowerCase() || undefined;

    // Match against known patterns
    for (const { pattern, saltName, defaultUnit } of this.patterns) {
      if (pattern.test(nameLower)) {
        suggestions.push({
          name: saltName,
          strength,
          unit: unit || defaultUnit,
          confidence: 'HIGH',
          source: 'pattern',
        });
      }
    }

    return suggestions;
  }

  /**
   * Query database for similar medicines
   */
  private static async queryDatabase(name: string): Promise<SuggestedSalt[]> {
    try {
      // Extract the base name (remove strength and form)
      const baseName = name
        .replace(/\d+\s*(mg|mcg|g|ml|iu|%)/gi, '')
        .replace(/(tablet|capsule|syrup|injection|cream|drops|tab|cap|inj)/gi, '')
        .trim();

      if (baseName.length < 3) {
        return [];
      }

      // Query API for similar medicines with composition
      const response = await fetch(`/api/drugs/similar?name=${encodeURIComponent(baseName)}&limit=10`);
      
      if (!response.ok) {
        // Fallback: try to get suggestions from pattern matching only
        // The bulk endpoint requires storeId which we may not have here
        console.log('[SaltSuggestion] Similar API not available, using pattern matching only');
        return [];
      }

      const similarMedicines = await response.json();
      return this.extractSaltsFromMedicines(similarMedicines);
    } catch (error) {
      console.error('[SaltSuggestion] Database query error:', error);
      return [];
    }
  }

  /**
   * Extract salts from medicine data
   */
  private static extractSaltsFromMedicines(medicines: any[]): SuggestedSalt[] {
    const suggestions: SuggestedSalt[] = [];
    
    if (!Array.isArray(medicines)) {
      return suggestions;
    }

    for (const medicine of medicines) {
      if (medicine.saltLinks && medicine.saltLinks.length > 0) {
        for (const link of medicine.saltLinks) {
          const saltName = link.salt?.name || link.name;
          if (saltName) {
            suggestions.push({
              name: saltName,
              strength: link.strengthValue,
              unit: link.strengthUnit,
              confidence: 'MEDIUM',
              source: 'database',
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Remove duplicates and rank by confidence
   */
  private static deduplicateAndRank(suggestions: SuggestedSalt[]): SuggestedSalt[] {
    const seen = new Map<string, SuggestedSalt>();

    for (const suggestion of suggestions) {
      const key = `${suggestion.name.toLowerCase()}-${suggestion.strength || 'none'}-${suggestion.unit || 'none'}`;
      
      const existing = seen.get(key);
      if (!existing || this.getConfidenceScore(suggestion.confidence) > this.getConfidenceScore(existing.confidence)) {
        seen.set(key, suggestion);
      }
    }

    // Convert to array and sort by confidence
    const unique = Array.from(seen.values());
    unique.sort((a, b) => this.getConfidenceScore(b.confidence) - this.getConfidenceScore(a.confidence));

    return unique;
  }

  /**
   * Get numeric score for confidence level
   */
  private static getConfidenceScore(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (confidence) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  /**
   * Record user's salt selection for learning
   */
  static async recordUserChoice(
    medicineName: string,
    selectedSalt: SuggestedSalt,
    storeId: string
  ): Promise<void> {
    try {
      await fetch('/api/salt-intelligence/record-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName,
          selectedSalt: selectedSalt.name,
          strength: selectedSalt.strength,
          unit: selectedSalt.unit,
          storeId,
        }),
      });
    } catch (error) {
      console.error('[SaltSuggestion] Failed to record user choice:', error);
    }
  }
}
