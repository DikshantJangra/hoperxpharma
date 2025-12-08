/**
 * GST Utility Functions (Backend)
 * Handles GST rate normalization for Indian tax compliance
 */

const VALID_GST_RATES = [0, 5, 12, 18, 28];

/**
 * Normalizes a GST rate to the nearest valid Indian GST rate
 * Valid rates: 0%, 5%, 12%, 18%, 28%
 * 
 * @param {number|null|undefined} rate - The GST rate to normalize
 * @returns {number} The nearest valid GST rate
 */
function normalizeGSTRate(rate) {
    // Handle null/undefined/NaN - default to 5%
    if (rate == null || isNaN(rate)) {
        return 5; // Default to 5% for pharmaceuticals
    }

    // Ensure rate is a number
    const numericRate = Number(rate);

    // If already valid, return as-is (allows manual editing)
    if (VALID_GST_RATES.includes(numericRate)) {
        return numericRate;
    }

    // Find nearest valid rate
    const nearest = VALID_GST_RATES.reduce((prev, curr) => {
        return Math.abs(curr - numericRate) < Math.abs(prev - numericRate) ? curr : prev;
    });

    return nearest;
}

/**
 * Checks if a GST rate is valid
 * @param {number} rate - The GST rate to check
 * @returns {boolean} true if the rate is in the valid list
 */
function isValidGSTRate(rate) {
    return VALID_GST_RATES.includes(rate);
}

module.exports = {
    normalizeGSTRate,
    isValidGSTRate,
    VALID_GST_RATES
};
