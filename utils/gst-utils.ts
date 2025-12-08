/**
 * GST Utility Functions
 * Handles GST rate normalization and validation for Indian tax compliance
 */

export const VALID_GST_RATES = [0, 5, 12, 18, 28] as const;

export type ValidGSTRate = typeof VALID_GST_RATES[number];

/**
 * Normalizes a GST rate to the nearest valid Indian GST rate
 * Valid rates: 0%, 5%, 12%, 18%, 28%
 * 
 * @param rate - The GST rate to normalize (can be any number)
 * @returns The nearest valid GST rate
 * 
 * @example
 * normalizeGSTRate(6) // returns 5
 * normalizeGSTRate(15) // returns 12
 * normalizeGSTRate(25) // returns 28
 * normalizeGSTRate(12) // returns 12 (already valid)
 */
export function normalizeGSTRate(rate: number | null | undefined): ValidGSTRate {
    // Handle null/undefined/NaN - default to 5%
    if (rate == null || isNaN(rate)) {
        return 5; // Default to 5% for pharmaceuticals
    }

    // Ensure rate is a number
    const numericRate = Number(rate);

    // If already valid, return as-is (allows manual editing)
    if (VALID_GST_RATES.includes(numericRate as ValidGSTRate)) {
        return numericRate as ValidGSTRate;
    }

    // Find nearest valid rate using reduce
    const nearest = VALID_GST_RATES.reduce((prev, curr) => {
        return Math.abs(curr - numericRate) < Math.abs(prev - numericRate) ? curr : prev;
    });

    return nearest;
}

/**
 * Checks if a GST rate is valid
 * @param rate - The GST rate to check
 * @returns true if the rate is in the valid list
 */
export function isValidGSTRate(rate: number): rate is ValidGSTRate {
    return VALID_GST_RATES.includes(rate as ValidGSTRate);
}

/**
 * Gets the GST rate category/description
 * @param rate - The GST rate
 * @returns Description of the GST category
 */
export function getGSTCategory(rate: ValidGSTRate): string {
    switch (rate) {
        case 0:
            return 'Exempt';
        case 5:
            return 'Essential goods';
        case 12:
            return 'Standard rate (Pharmaceuticals)';
        case 18:
            return 'Standard rate';
        case 28:
            return 'Luxury/Sin goods';
        default:
            return 'Unknown';
    }
}
