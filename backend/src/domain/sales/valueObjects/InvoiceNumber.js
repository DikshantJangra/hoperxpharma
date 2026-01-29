/**
 * InvoiceNumber Value Object
 * Encapsulates invoice number with validation and generation logic
 */

class InvoiceNumber {
    constructor(value) {
        if (!value || typeof value !== 'string') {
            throw new Error('Invoice number must be a non-empty string');
        }

        const trimmed = value.trim();
        if (trimmed.length === 0) {
            throw new Error('Invoice number cannot be empty');
        }

        // Validate format: INV-YYYYMM-XXXX
        if (!this.isValid(trimmed)) {
            throw new Error(`Invalid invoice number format: ${trimmed}. Expected format: INV-YYYYMM-XXXX`);
        }

        this.value = trimmed.toUpperCase();
    }

    static fromPrisma(value) {
        return new InvoiceNumber(value);
    }

    /**
     * Generate new invoice number
     */
    static generate(storePrefix = 'INV', sequence) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const seq = String(sequence).padStart(4, '0');

        return new InvoiceNumber(`${storePrefix}-${year}${month}-${seq}`);
    }

    /**
     * Parse invoice number to extract components
     */
    parse() {
        const parts = this.value.split('-');
        if (parts.length !== 3) {
            return null;
        }

        return {
            prefix: parts[0],
            yearMonth: parts[1],
            sequence: parseInt(parts[2], 10)
        };
    }

    /**
     * Validate invoice number format
     */
    isValid(value) {
        // Allow flexible format for now, can tighten later
        // Examples: INV-202601-0001, SALE-202601-0123
        const pattern = /^[A-Z]+-\d{6}-\d{4}$/;
        return pattern.test(value);
    }

    getValue() {
        return this.value;
    }

    equals(other) {
        if (!other) return false;
        return this.value === other.value;
    }

    toString() {
        return this.value;
    }

    toJSON() {
        return this.value;
    }

    toPrisma() {
        return this.value;
    }
}

module.exports = InvoiceNumber;
