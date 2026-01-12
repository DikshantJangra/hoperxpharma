/**
 * Regex Matcher for Salt Intelligence
 * Parses composition strings like "Amoxycillin (500mg) + Clavulanic Acid (125mg)"
 */

export interface ExtractedComponent {
    name: string;
    strengthValue: number | null;
    strengthUnit: string | null;
    originalPart: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class RegexMatcher {
    /**
     * Parse a composition string into components
     * @param composition e.g. "Amoxycillin (500mg) + Clavulanic Acid (125mg)"
     */
    static parseComposition(composition: string): ExtractedComponent[] {
        if (!composition) return [];

        // 1. Split by common delimiters (+, /, &)
        const parts = composition.split(/[+\/&]+/).map(p => p.trim()).filter(p => !!p);

        const results: ExtractedComponent[] = [];

        // Regex to extract Name, Value, Unit
        // Matches: "Amoxycillin (500mg)" OR "Amoxycillin 500mg" OR "Amoxycillin IP 500mg"
        // Group 1: Name
        // Group 2/4: Strength Value
        // Group 3/5: Strength Unit
        const regex = /^(.+?)\s*(?:\(\s*([\d\.]+)\s*([a-zA-Z\/%]+)\s*\)|(\d+)\s*([a-zA-Z]+))?$/;

        parts.forEach(part => {
            const match = part.match(regex);

            if (match) {
                let name = match[1].trim();
                const strengthVal = match[2] || match[4];
                const strengthUnit = match[3] || match[5];

                // Cleanup Name cleanup (Remove "IP", "BP", "USP")
                name = name.replace(/\b(IP|BP|USP)\b/g, '').replace(/\s+/g, ' ').trim();

                results.push({
                    name,
                    strengthValue: strengthVal ? parseFloat(strengthVal) : null,
                    strengthUnit: strengthUnit ? strengthUnit.toLowerCase() : null,
                    originalPart: part,
                    confidence: (strengthVal && strengthUnit) ? 'HIGH' : 'MEDIUM'
                });
            } else {
                results.push({
                    name: part,
                    strengthValue: null,
                    strengthUnit: null,
                    originalPart: part,
                    confidence: 'LOW'
                });
            }
        });

        return results;
    }
}
