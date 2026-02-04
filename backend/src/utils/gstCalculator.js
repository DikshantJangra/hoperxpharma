/**
 * GST Calculation Engine
 * Core utility for computing GST taxes in compliance with Indian tax law
 */

/**
 * Compute GST for a single sale item
 * @param {Object} item - Sale item with quantity, mrp, discount
 * @param {Object} taxSlab - Tax slab with rates
 * @param {boolean} isIgst - Whether to apply IGST (interstate) or CGST+SGST
 * @returns {Object} Tax breakup
 */
function computeItemTax(item, taxSlab, isIgst = false) {
    const { quantity, mrp, discount = 0 } = item;

    // In a retail pharmacy context, MRP is ALWAYS tax-inclusive.
    // Line Total (what customer pays) = (MRP * quantity) - discount
    const grossAmount = mrp * quantity;
    const lineTotal = Math.max(0, grossAmount - discount);

    // Rounding helper
    const round = (val) => Math.round(val * 100) / 100;

    // Handle exempt/zero-rated items
    if (!taxSlab || taxSlab.taxType === 'EXEMPT' || taxSlab.rate === 0) {
        return {
            taxableAmount: round(lineTotal),
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            cessAmount: 0,
            totalTax: 0,
            lineTotal: round(lineTotal)
        };
    }

    // Extraction formula: Taxable Base = Total / (1 + Rate/100)
    const gstRate = taxSlab.rate || 0;
    const taxableAmount = lineTotal / (1 + gstRate / 100);
    const totalTax = lineTotal - taxableAmount;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cessAmount = 0;

    // Distribute tax components
    if (isIgst) {
        // Interstate: Apply IGST
        igstAmount = totalTax;
    } else {
        // Intrastate: Apply CGST + SGST (50/50 split)
        // If specific rates are provided in slab, use them (but usually it's just half the total rate)
        cgstAmount = totalTax / 2;
        sgstAmount = totalTax / 2;
    }

    // Cess usually applies on the taxable value if configured
    if (taxSlab.cessRate && taxSlab.cessRate > 0) {
        cessAmount = (taxableAmount * taxSlab.cessRate) / 100;
        // In some cases cess is added ON TOP of the inclusive price, but usually it's part of it or handled separately.
        // For pharmacy, cess is rarely used/inclusive in drug prices.
    }

    return {
        taxableAmount: round(taxableAmount),
        cgstAmount: round(cgstAmount),
        sgstAmount: round(sgstAmount),
        igstAmount: round(igstAmount),
        cessAmount: round(cessAmount),
        totalTax: round(totalTax),
        lineTotal: round(lineTotal)
    };
}

/**
 * Compute aggregated GST for entire sale
 * @param {Array} items - Array of sale items with tax breakup
 * @returns {Object} Aggregated tax totals
 */
function computeSaleTax(items) {
    const totals = items.reduce((acc, item) => {
        return {
            taxableAmount: acc.taxableAmount + (item.taxableAmount || 0),
            cgstAmount: acc.cgstAmount + (item.cgstAmount || 0),
            sgstAmount: acc.sgstAmount + (item.sgstAmount || 0),
            igstAmount: acc.igstAmount + (item.igstAmount || 0),
            cessAmount: acc.cessAmount + (item.cessAmount || 0)
        };
    }, {
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0
    });

    totals.totalTax = totals.cgstAmount + totals.sgstAmount + totals.igstAmount + totals.cessAmount;

    // Round to 2 decimal places
    Object.keys(totals).forEach(key => {
        totals[key] = parseFloat(totals[key].toFixed(2));
    });

    return totals;
}

/**
 * Determine place of supply from customer GSTIN or address
 * @param {Object} customer - Customer with gstin and/or state
 * @param {string} storeState - Store's state code
 * @returns {string} State code for place of supply
 */
function determinePlaceOfSupply(customer, storeState) {
    // Priority 1: Extract from GSTIN (first 2 digits)
    if (customer?.gstin && customer.gstin.length >= 2) {
        return customer.gstin.substring(0, 2);
    }

    // Priority 2: Customer's state (if available)
    if (customer?.state) {
        return getStateCode(customer.state);
    }

    // Priority 3: Default to store's state (local sale)
    return storeState;
}

/**
 * Determine GSTR category for sale
 * @param {Object} sale - Sale object with buyerGstin, total, etc.
 * @returns {string} GSTR category
 */
function classifyGSTRCategory(sale) {
    // Check if export
    if (sale.isExport) {
        return 'EXPORT';
    }

    // B2B: Customer has GSTIN
    if (sale.buyerGstin && sale.buyerGstin.length === 15) {
        return 'B2B';
    }

    // B2C Large: Invoice value > ₹2.5 lakh
    if (sale.total > 250000) {
        return 'B2C_LARGE';
    }

    // B2C Small: Default for walk-in customers
    return 'B2C_SMALL';
}

/**
 * Map state name to state code
 * @param {string} stateName - Full state name
 * @returns {string} 2-digit state code
 */
function getStateCode(stateName) {
    const stateCodeMap = {
        'Andaman and Nicobar Islands': '35',
        'Andhra Pradesh': '37',
        'Arunachal Pradesh': '12',
        'Assam': '18',
        'Bihar': '10',
        'Chandigarh': '04',
        'Chhattisgarh': '22',
        'Dadra and Nagar Haveli and Daman and Diu': '26',
        'Delhi': '07',
        'Goa': '30',
        'Gujarat': '24',
        'Haryana': '06',
        'Himachal Pradesh': '02',
        'Jammu and Kashmir': '01',
        'Jharkhand': '20',
        'Karnataka': '29',
        'Kerala': '32',
        'Ladakh': '38',
        'Lakshadweep': '31',
        'Madhya Pradesh': '23',
        'Maharashtra': '27',
        'Manipur': '14',
        'Meghalaya': '17',
        'Mizoram': '15',
        'Nagaland': '13',
        'Odisha': '21',
        'Puducherry': '34',
        'Punjab': '03',
        'Rajasthan': '08',
        'Sikkim': '11',
        'Tamil Nadu': '33',
        'Telangana': '36',
        'Tripura': '16',
        'Uttar Pradesh': '09',
        'Uttarakhand': '05',
        'West Bengal': '19'
    };

    return stateCodeMap[stateName] || '00';
}

/**
 * Validate GSTIN format
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} Is valid
 */
function validateGSTIN(gstin) {
    if (!gstin || gstin.length !== 15) return false;

    // GSTIN format: 2 digits state code + 10 chars PAN + 1 char entity + 1 char Z + 1 char checksum
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
}

module.exports = {
    computeItemTax,
    computeSaleTax,
    determinePlaceOfSupply,
    classifyGSTRCategory,
    getStateCode,
    validateGSTIN
};
